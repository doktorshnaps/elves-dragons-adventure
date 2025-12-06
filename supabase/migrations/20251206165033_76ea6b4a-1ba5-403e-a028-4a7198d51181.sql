-- Drop marketplace RPC functions
DROP FUNCTION IF EXISTS public.cancel_marketplace_listing(uuid, text);
DROP FUNCTION IF EXISTS public.create_marketplace_listing(text, jsonb, integer, text);
DROP FUNCTION IF EXISTS public.purchase_marketplace_listing(uuid, text);

-- Drop marketplace_listings table (will also drop RLS policies)
DROP TABLE IF EXISTS public.marketplace_listings CASCADE;

-- Remove is_on_marketplace and marketplace_listing_id from card_instances
ALTER TABLE public.card_instances 
DROP COLUMN IF EXISTS is_on_marketplace,
DROP COLUMN IF EXISTS marketplace_listing_id;