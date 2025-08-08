-- Fix ambiguous variable/column references in process_marketplace_purchase
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
  SELECT m.id, m.seller_id, m.price, m.status
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