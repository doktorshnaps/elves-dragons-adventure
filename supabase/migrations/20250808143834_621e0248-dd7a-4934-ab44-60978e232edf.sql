-- Create function to atomically create a listing and remove the item from seller
CREATE OR REPLACE FUNCTION public.create_marketplace_listing(
  p_seller_id uuid,
  p_listing_type text,
  p_item jsonb,
  p_price integer
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_listing_id uuid;
  v_item_id text;
  v_exists boolean;
  g RECORD;
BEGIN
  IF p_seller_id IS NULL OR p_listing_type IS NULL OR p_item IS NULL OR p_price IS NULL THEN
    RAISE EXCEPTION 'Invalid input parameters';
  END IF;
  IF p_listing_type NOT IN ('card','item') THEN
    RAISE EXCEPTION 'Invalid listing type';
  END IF;
  v_item_id := p_item->>'id';
  IF v_item_id IS NULL OR v_item_id = '' THEN
    RAISE EXCEPTION 'Item id missing';
  END IF;

  -- Lock seller game_data row
  SELECT * INTO g FROM public.game_data WHERE user_id = p_seller_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Seller game data not found';
  END IF;

  IF p_listing_type = 'card' THEN
    -- Ensure the card is not part of selected team
    IF EXISTS (
      SELECT 1
      FROM jsonb_array_elements(COALESCE(g.selected_team, '[]'::jsonb)) AS st(elem)
      WHERE (st.elem->'hero'->>'id' = v_item_id) OR (st.elem->'dragon'->>'id' = v_item_id)
    ) THEN
      RAISE EXCEPTION 'Card is in selected team';
    END IF;

    -- Ensure card exists
    v_exists := EXISTS (
      SELECT 1 FROM jsonb_array_elements(COALESCE(g.cards, '[]'::jsonb)) AS c(elem)
      WHERE c.elem->>'id' = v_item_id
    );
    IF NOT v_exists THEN
      RAISE EXCEPTION 'Card not found in seller inventory';
    END IF;

    -- Remove card from seller deck
    UPDATE public.game_data gd
    SET cards = (
      SELECT COALESCE(jsonb_agg(elem), '[]'::jsonb)
      FROM jsonb_array_elements(COALESCE(gd.cards, '[]'::jsonb)) AS e(elem)
      WHERE e.elem->>'id' <> v_item_id
    ),
    updated_at = now()
    WHERE gd.user_id = p_seller_id;
  ELSE
    -- Ensure item exists
    v_exists := EXISTS (
      SELECT 1 FROM jsonb_array_elements(COALESCE(g.inventory, '[]'::jsonb)) AS i(elem)
      WHERE i.elem->>'id' = v_item_id
    );
    IF NOT v_exists THEN
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
    WHERE gd.user_id = p_seller_id;
  END IF;

  -- Create listing
  INSERT INTO public.marketplace_listings (seller_id, type, item, price, status)
  VALUES (p_seller_id, p_listing_type, p_item, p_price, 'active')
  RETURNING id INTO v_listing_id;

  RETURN v_listing_id;
END;
$function$;

-- Update purchase function to also transfer the item to the buyer
CREATE OR REPLACE FUNCTION public.process_marketplace_purchase(listing_id uuid, buyer_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_listing_id uuid := listing_id;
  v_buyer_id uuid := buyer_id;
  l_listing RECORD;
  v_buyer_balance INTEGER;
  v_seller_id uuid;
  v_listing_price INTEGER;
BEGIN
  -- Validate input parameters first
  IF v_listing_id IS NULL OR v_buyer_id IS NULL THEN
    RAISE EXCEPTION 'Invalid input parameters';
  END IF;

  -- Lock the listing row to prevent race conditions
  SELECT m.id, m.seller_id, m.price, m.status, m.item, m.type
  INTO l_listing 
  FROM public.marketplace_listings AS m
  WHERE m.id = v_listing_id 
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Listing not found';
  END IF;

  -- Store critical values in variables to avoid repeated access
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
  SET balance = balance - v_listing_price 
  WHERE user_id = v_buyer_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Failed to deduct buyer balance';
  END IF;

  UPDATE public.game_data 
  SET balance = balance + v_listing_price 
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