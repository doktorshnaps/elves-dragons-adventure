-- Ensure updated_at column exists and is maintained
ALTER TABLE public.marketplace_listings
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Auto-update updated_at on changes
DROP TRIGGER IF EXISTS set_marketplace_listings_updated_at ON public.marketplace_listings;
CREATE TRIGGER set_marketplace_listings_updated_at
BEFORE UPDATE ON public.marketplace_listings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Replace function using user's logic, avoiding name ambiguity while keeping existing parameter names for frontend compatibility
CREATE OR REPLACE FUNCTION public.process_marketplace_purchase(listing_id uuid, buyer_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_listing_id uuid := listing_id;
  v_buyer_id uuid := buyer_id;
  l_record RECORD;
  buyer_balance INTEGER;
  seller_id uuid;
  listing_price INTEGER;
BEGIN
  -- Validate input parameters first
  IF v_listing_id IS NULL OR v_buyer_id IS NULL THEN
    RAISE EXCEPTION 'Invalid input parameters';
  END IF;

  -- Lock the listing row to prevent race conditions
  SELECT id, seller_id, price, status 
  INTO l_record 
  FROM public.marketplace_listings 
  WHERE id = v_listing_id 
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Listing not found';
  END IF;

  -- Store critical values in variables to avoid repeated access
  seller_id := l_record.seller_id;
  listing_price := l_record.price;

  IF l_record.status <> 'active' THEN
    RAISE EXCEPTION 'Listing is not active';
  END IF;

  IF seller_id = v_buyer_id THEN
    RAISE EXCEPTION 'Cannot buy own listing';
  END IF;

  -- Check buyer balance and lock the row
  SELECT balance INTO buyer_balance 
  FROM public.game_data 
  WHERE user_id = v_buyer_id 
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Buyer game data not found';
  END IF;

  IF buyer_balance < listing_price THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;

  -- Perform balance transfer atomically
  UPDATE public.game_data SET balance = balance - listing_price WHERE user_id = v_buyer_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Failed to deduct buyer balance';
  END IF;

  UPDATE public.game_data SET balance = balance + listing_price WHERE user_id = seller_id;
  IF NOT FOUND THEN
    -- Critical: refund buyer if seller update fails
    UPDATE public.game_data SET balance = balance + listing_price WHERE user_id = v_buyer_id;
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
    UPDATE public.game_data SET balance = balance + listing_price WHERE user_id = v_buyer_id;
    UPDATE public.game_data SET balance = balance - listing_price WHERE user_id = seller_id;
    RAISE EXCEPTION 'Failed to update listing, transaction rolled back';
  END IF;
END;
$$;

-- Ensure realtime works with full row replica
ALTER TABLE public.marketplace_listings REPLICA IDENTITY FULL;