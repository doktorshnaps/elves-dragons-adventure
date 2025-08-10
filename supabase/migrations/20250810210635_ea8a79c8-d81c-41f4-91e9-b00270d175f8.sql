-- Hardened marketplace functions: remove client-supplied user ids, validate on server, fetch item JSON from DB

-- 1) Replace process_marketplace_purchase(listing_id uuid, buyer_id uuid) with version using auth.uid()
DROP FUNCTION IF EXISTS public.process_marketplace_purchase(uuid, uuid);
CREATE OR REPLACE FUNCTION public.process_marketplace_purchase(listing_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_listing_id uuid := listing_id;
  v_buyer_id uuid := auth.uid();
  l_listing RECORD;
  v_buyer_balance INTEGER;
  v_seller_id uuid;
  v_listing_price INTEGER;
BEGIN
  -- Ensure caller is authenticated
  IF v_buyer_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Restrict search_path for safety
  PERFORM set_config('search_path', 'public', true);

  -- Lock the listing row to prevent race conditions
  SELECT m.id, m.seller_id, m.price, m.status, m.item, m.type
  INTO l_listing 
  FROM public.marketplace_listings AS m
  WHERE m.id = v_listing_id 
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Listing not found';
  END IF;

  v_seller_id := l_listing.seller_id;
  v_listing_price := l_listing.price;

  IF l_listing.status <> 'active' THEN
    RAISE EXCEPTION 'Listing is not active';
  END IF;

  IF v_seller_id = v_buyer_id THEN
    RAISE EXCEPTION 'Cannot buy own listing';
  END IF;

  -- Check buyer balance and lock the row
  SELECT g.balance INTO v_buyer_balance 
  FROM public.game_data AS g
  WHERE g.user_id = v_buyer_id 
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Buyer game data not found';
  END IF;

  IF v_buyer_balance < v_listing_price THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;

  -- Perform balance transfer atomically
  UPDATE public.game_data 
  SET balance = balance - v_listing_price, updated_at = now()
  WHERE user_id = v_buyer_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Failed to deduct buyer balance';
  END IF;

  UPDATE public.game_data 
  SET balance = balance + v_listing_price, updated_at = now()
  WHERE user_id = v_seller_id;
  IF NOT FOUND THEN
    -- Critical: refund buyer if seller update fails
    UPDATE public.game_data SET balance = balance + v_listing_price WHERE user_id = v_buyer_id;
    RAISE EXCEPTION 'Failed to credit seller, transaction rolled back';
  END IF;

  -- Transfer the item to the buyer (cards or items)
  IF l_listing.type = 'item' THEN
    UPDATE public.game_data 
    SET inventory = COALESCE(inventory, '[]'::jsonb) || jsonb_build_array(l_listing.item),
        updated_at = now()
    WHERE user_id = v_buyer_id;
  ELSE
    UPDATE public.game_data 
    SET cards = COALESCE(cards, '[]'::jsonb) || jsonb_build_array(l_listing.item),
        updated_at = now()
    WHERE user_id = v_buyer_id;
  END IF;
  IF NOT FOUND THEN
    -- rollback balances if append failed for some reason
    UPDATE public.game_data SET balance = balance + v_listing_price WHERE user_id = v_buyer_id;
    UPDATE public.game_data SET balance = balance - v_listing_price WHERE user_id = v_seller_id;
    RAISE EXCEPTION 'Failed to transfer item to buyer, transaction rolled back';
  END IF;

  -- Mark listing as sold and record buyer
  UPDATE public.marketplace_listings
  SET status = 'sold', 
      buyer_id = v_buyer_id, 
      sold_at = now(),
      updated_at = now()
  WHERE id = v_listing_id;
  
  IF NOT FOUND THEN
    -- Critical: rollback balance changes if listing update fails
    UPDATE public.game_data SET balance = balance + v_listing_price WHERE user_id = v_buyer_id;
    UPDATE public.game_data SET balance = balance - v_listing_price WHERE user_id = v_seller_id;
    RAISE EXCEPTION 'Failed to update listing, transaction rolled back';
  END IF;
END;
$function$;

-- 2) Replace create_marketplace_listing to use auth.uid() and fetch item JSON from DB
DROP FUNCTION IF EXISTS public.create_marketplace_listing(uuid, text, jsonb, integer);
CREATE OR REPLACE FUNCTION public.create_marketplace_listing(p_listing_type text, p_item_id text, p_price integer)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_listing_id uuid;
  v_item_id text := p_item_id;
  v_exists boolean;
  g RECORD;
  v_item_json jsonb;
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF p_listing_type IS NULL OR v_item_id IS NULL OR p_price IS NULL THEN
    RAISE EXCEPTION 'Invalid input parameters';
  END IF;
  IF p_listing_type NOT IN ('card','item') THEN
    RAISE EXCEPTION 'Invalid listing type';
  END IF;
  IF v_item_id = '' THEN
    RAISE EXCEPTION 'Item id missing';
  END IF;
  IF p_price <= 0 OR p_price > 1000000000 THEN
    RAISE EXCEPTION 'Invalid price';
  END IF;

  PERFORM set_config('search_path', 'public', true);

  -- Lock seller game_data row
  SELECT * INTO g FROM public.game_data WHERE user_id = v_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Seller game data not found';
  END IF;

  IF p_listing_type = 'card' THEN
    -- Ensure card exists and fetch JSON
    SELECT e.elem INTO v_item_json
    FROM jsonb_array_elements(COALESCE(g.cards, '[]'::jsonb)) AS e(elem)
    WHERE e.elem->>'id' = v_item_id
    LIMIT 1;

    IF v_item_json IS NULL THEN
      RAISE EXCEPTION 'Card not found in seller inventory';
    END IF;

    -- Ensure the card is not part of selected team
    IF EXISTS (
      SELECT 1
      FROM jsonb_array_elements(COALESCE(g.selected_team, '[]'::jsonb)) AS st(elem)
      WHERE (st.elem->'hero'->>'id' = v_item_id) OR (st.elem->'dragon'->>'id' = v_item_id)
    ) THEN
      RAISE EXCEPTION 'Card is in selected team';
    END IF;

    -- Remove card from seller deck
    UPDATE public.game_data gd
    SET cards = (
      SELECT COALESCE(jsonb_agg(elem), '[]'::jsonb)
      FROM jsonb_array_elements(COALESCE(gd.cards, '[]'::jsonb)) AS e(elem)
      WHERE e.elem->>'id' <> v_item_id
    ),
    updated_at = now()
    WHERE gd.user_id = v_user_id;
  ELSE
    -- Ensure item exists and fetch JSON
    SELECT e.elem INTO v_item_json
    FROM jsonb_array_elements(COALESCE(g.inventory, '[]'::jsonb)) AS e(elem)
    WHERE e.elem->>'id' = v_item_id
    LIMIT 1;

    IF v_item_json IS NULL THEN
      RAISE EXCEPTION 'Item not found in seller inventory';
    END IF;

    -- Remove item from seller inventory
    UPDATE public.game_data gd
    SET inventory = (
      SELECT COALESCE(jsonb_agg(elem), '[]'::jsonb)
      FROM jsonb_array_elements(COALESCE(gd.inventory, '[]'::jsonb)) AS e(elem)
      WHERE e.elem->>'id' <> v_item_id
    ),
    updated_at = now()
    WHERE gd.user_id = v_user_id;
  END IF;

  -- Create listing using server-fetched JSON
  INSERT INTO public.marketplace_listings (seller_id, type, item, price, status)
  VALUES (v_user_id, p_listing_type, v_item_json, p_price, 'active')
  RETURNING id INTO v_listing_id;

  RETURN v_listing_id;
END;
$function$;

-- 3) Replace cancel_marketplace_listing to use auth.uid()
DROP FUNCTION IF EXISTS public.cancel_marketplace_listing(uuid, uuid);
CREATE OR REPLACE FUNCTION public.cancel_marketplace_listing(p_listing_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  l RECORD;
  v_requester_id uuid := auth.uid();
BEGIN
  IF p_listing_id IS NULL THEN
    RAISE EXCEPTION 'Invalid input parameters';
  END IF;
  IF v_requester_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  PERFORM set_config('search_path', 'public', true);

  -- Lock the listing row
  SELECT id, seller_id, status, item, type
  INTO l
  FROM public.marketplace_listings
  WHERE id = p_listing_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Listing not found';
  END IF;

  IF l.status <> 'active' THEN
    RAISE EXCEPTION 'Only active listings can be cancelled';
  END IF;

  IF l.seller_id <> v_requester_id THEN
    RAISE EXCEPTION 'Only seller can cancel the listing';
  END IF;

  -- Return the item to seller
  IF l.type = 'item' THEN
    UPDATE public.game_data
    SET inventory = COALESCE(inventory, '[]'::jsonb) || jsonb_build_array(l.item),
        updated_at = now()
    WHERE user_id = l.seller_id;
  ELSE
    UPDATE public.game_data
    SET cards = COALESCE(cards, '[]'::jsonb) || jsonb_build_array(l.item),
        updated_at = now()
    WHERE user_id = l.seller_id;
  END IF;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Failed to return item to seller';
  END IF;

  -- Mark the listing as cancelled
  UPDATE public.marketplace_listings
  SET status = 'cancelled', updated_at = now()
  WHERE id = p_listing_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Failed to cancel listing';
  END IF;
END;
$function$;