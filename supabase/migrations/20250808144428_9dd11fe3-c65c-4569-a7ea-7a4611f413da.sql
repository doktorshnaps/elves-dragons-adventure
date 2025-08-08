-- Function to cancel a listing and return the item to the seller
CREATE OR REPLACE FUNCTION public.cancel_marketplace_listing(
  p_listing_id uuid,
  p_requester_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  l RECORD;
BEGIN
  IF p_listing_id IS NULL OR p_requester_id IS NULL THEN
    RAISE EXCEPTION 'Invalid input parameters';
  END IF;

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

  IF l.seller_id <> p_requester_id THEN
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