-- Fix security warnings by setting search_path for existing functions
create or replace function public.reset_shop_inventory()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Обновляем количество всех товаров до 50 и устанавливаем новое время сброса
  update public.shop_inventory 
  set 
    available_quantity = 50,
    last_reset_time = now(),
    next_reset_time = now() + interval '8 hours',
    updated_at = now()
  where next_reset_time <= now();

  -- Если таблица пустая, добавляем все предметы
  if not exists (select 1 from public.shop_inventory limit 1) then
    insert into public.shop_inventory (item_id, available_quantity, last_reset_time, next_reset_time)
    select 
      generate_series(1, 12) as item_id,
      50 as available_quantity,
      now() as last_reset_time,
      now() + interval '8 hours' as next_reset_time;
  end if;
end;
$$;

create or replace function public.process_marketplace_purchase(listing_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_listing_id uuid := listing_id;
  v_buyer_id uuid := auth.uid();
  l_listing record;
  v_buyer_balance integer;
  v_seller_id uuid;
  v_listing_price integer;
begin
  -- Ensure caller is authenticated
  if v_buyer_id is null then
    raise exception 'Not authenticated';
  end if;

  -- Lock the listing row to prevent race conditions
  select m.id, m.seller_id, m.price, m.status, m.item, m.type
  into l_listing 
  from public.marketplace_listings as m
  where m.id = v_listing_id 
  for update;
  
  if not found then
    raise exception 'Listing not found';
  end if;

  v_seller_id := l_listing.seller_id;
  v_listing_price := l_listing.price;

  if l_listing.status <> 'active' then
    raise exception 'Listing is not active';
  end if;

  if v_seller_id = v_buyer_id then
    raise exception 'Cannot buy own listing';
  end if;

  -- Check buyer balance and lock the row
  select g.balance into v_buyer_balance 
  from public.game_data as g
  where g.user_id = v_buyer_id 
  for update;
  
  if not found then
    raise exception 'Buyer game data not found';
  end if;

  if v_buyer_balance < v_listing_price then
    raise exception 'Insufficient balance';
  end if;

  -- Perform balance transfer atomically
  update public.game_data 
  set balance = balance - v_listing_price, updated_at = now()
  where user_id = v_buyer_id;
  if not found then
    raise exception 'Failed to deduct buyer balance';
  end if;

  update public.game_data 
  set balance = balance + v_listing_price, updated_at = now()
  where user_id = v_seller_id;
  if not found then
    -- Critical: refund buyer if seller update fails
    update public.game_data set balance = balance + v_listing_price where user_id = v_buyer_id;
    raise exception 'Failed to credit seller, transaction rolled back';
  end if;

  -- Transfer the item to the buyer (cards or items)
  if l_listing.type = 'item' then
    update public.game_data 
    set inventory = coalesce(inventory, '[]'::jsonb) || jsonb_build_array(l_listing.item),
        updated_at = now()
    where user_id = v_buyer_id;
  else
    update public.game_data 
    set cards = coalesce(cards, '[]'::jsonb) || jsonb_build_array(l_listing.item),
        updated_at = now()
    where user_id = v_buyer_id;
  end if;
  if not found then
    -- rollback balances if append failed for some reason
    update public.game_data set balance = balance + v_listing_price where user_id = v_buyer_id;
    update public.game_data set balance = balance - v_listing_price where user_id = v_seller_id;
    raise exception 'Failed to transfer item to buyer, transaction rolled back';
  end if;

  -- Mark listing as sold and record buyer
  update public.marketplace_listings
  set status = 'sold', 
      buyer_id = v_buyer_id, 
      sold_at = now(),
      updated_at = now()
  where id = v_listing_id;
  
  if not found then
    -- Critical: rollback balance changes if listing update fails
    update public.game_data set balance = balance + v_listing_price where user_id = v_buyer_id;
    update public.game_data set balance = balance - v_listing_price where user_id = v_seller_id;
    raise exception 'Failed to update listing, transaction rolled back';
  end if;
end;
$$;

create or replace function public.create_marketplace_listing(p_listing_type text, p_item_id text, p_price integer)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_listing_id uuid;
  v_item_id text := p_item_id;
  v_exists boolean;
  g record;
  v_item_json jsonb;
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;
  if p_listing_type is null or v_item_id is null or p_price is null then
    raise exception 'Invalid input parameters';
  end if;
  if p_listing_type not in ('card','item') then
    raise exception 'Invalid listing type';
  end if;
  if v_item_id = '' then
    raise exception 'Item id missing';
  end if;
  if p_price <= 0 or p_price > 1000000000 then
    raise exception 'Invalid price';
  end if;

  -- Lock seller game_data row
  select * into g from public.game_data where user_id = v_user_id for update;
  if not found then
    raise exception 'Seller game data not found';
  end if;

  if p_listing_type = 'card' then
    -- Ensure card exists and fetch JSON
    select e.elem into v_item_json
    from jsonb_array_elements(coalesce(g.cards, '[]'::jsonb)) as e(elem)
    where e.elem->>'id' = v_item_id
    limit 1;

    if v_item_json is null then
      raise exception 'Card not found in seller inventory';
    end if;

    -- Ensure the card is not part of selected team
    if exists (
      select 1
      from jsonb_array_elements(coalesce(g.selected_team, '[]'::jsonb)) as st(elem)
      where (st.elem->'hero'->>'id' = v_item_id) or (st.elem->'dragon'->>'id' = v_item_id)
    ) then
      raise exception 'Card is in selected team';
    end if;

    -- Remove card from seller deck
    update public.game_data gd
    set cards = (
      select coalesce(jsonb_agg(elem), '[]'::jsonb)
      from jsonb_array_elements(coalesce(gd.cards, '[]'::jsonb)) as e(elem)
      where e.elem->>'id' <> v_item_id
    ),
    updated_at = now()
    where gd.user_id = v_user_id;
  else
    -- Ensure item exists and fetch JSON
    select e.elem into v_item_json
    from jsonb_array_elements(coalesce(g.inventory, '[]'::jsonb)) as e(elem)
    where e.elem->>'id' = v_item_id
    limit 1;

    if v_item_json is null then
      raise exception 'Item not found in seller inventory';
    end if;

    -- Remove item from seller inventory
    update public.game_data gd
    set inventory = (
      select coalesce(jsonb_agg(elem), '[]'::jsonb)
      from jsonb_array_elements(coalesce(gd.inventory, '[]'::jsonb)) as e(elem)
      where e.elem->>'id' <> v_item_id
    ),
    updated_at = now()
    where gd.user_id = v_user_id;
  end if;

  -- Create listing using server-fetched JSON
  insert into public.marketplace_listings (seller_id, type, item, price, status)
  values (v_user_id, p_listing_type, v_item_json, p_price, 'active')
  returning id into v_listing_id;

  return v_listing_id;
end;
$$;

create or replace function public.cancel_marketplace_listing(p_listing_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  l record;
  v_requester_id uuid := auth.uid();
begin
  if p_listing_id is null then
    raise exception 'Invalid input parameters';
  end if;
  if v_requester_id is null then
    raise exception 'Not authenticated';
  end if;

  -- Lock the listing row
  select id, seller_id, status, item, type
  into l
  from public.marketplace_listings
  where id = p_listing_id
  for update;

  if not found then
    raise exception 'Listing not found';
  end if;

  if l.status <> 'active' then
    raise exception 'Only active listings can be cancelled';
  end if;

  if l.seller_id <> v_requester_id then
    raise exception 'Only seller can cancel the listing';
  end if;

  -- Return the item to seller
  if l.type = 'item' then
    update public.game_data
    set inventory = coalesce(inventory, '[]'::jsonb) || jsonb_build_array(l.item),
        updated_at = now()
    where user_id = l.seller_id;
  else
    update public.game_data
    set cards = coalesce(cards, '[]'::jsonb) || jsonb_build_array(l.item),
        updated_at = now()
    where user_id = l.seller_id;
  end if;
  if not found then
    raise exception 'Failed to return item to seller';
  end if;

  -- Mark the listing as cancelled
  update public.marketplace_listings
  set status = 'cancelled', updated_at = now()
  where id = p_listing_id;
  if not found then
    raise exception 'Failed to cancel listing';
  end if;
end;
$$;