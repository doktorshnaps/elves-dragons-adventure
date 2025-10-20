-- Add marketplace lock field to card_instances
ALTER TABLE public.card_instances 
ADD COLUMN IF NOT EXISTS is_on_marketplace boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS marketplace_listing_id uuid DEFAULT NULL;

-- Add NFT fields to marketplace_listings
ALTER TABLE public.marketplace_listings
ADD COLUMN IF NOT EXISTS nft_contract_id text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS nft_token_id text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS payment_token_contract text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS is_nft_listing boolean DEFAULT false;

-- Index for faster NFT marketplace queries
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_nft 
ON public.marketplace_listings(nft_contract_id, nft_token_id) 
WHERE is_nft_listing = true;

-- Index for marketplace locked cards
CREATE INDEX IF NOT EXISTS idx_card_instances_marketplace 
ON public.card_instances(is_on_marketplace, marketplace_listing_id) 
WHERE is_on_marketplace = true;

COMMENT ON COLUMN card_instances.is_on_marketplace IS 'Flag indicating if this NFT card is currently listed on marketplace';
COMMENT ON COLUMN card_instances.marketplace_listing_id IS 'Reference to the marketplace listing if card is on sale';
COMMENT ON COLUMN marketplace_listings.nft_contract_id IS 'NEAR NFT contract address for NFT listings';
COMMENT ON COLUMN marketplace_listings.nft_token_id IS 'Token ID for NFT listings';
COMMENT ON COLUMN marketplace_listings.payment_token_contract IS 'Token contract for payment (e.g. gt-1733.meme-cooking.near)';
COMMENT ON COLUMN marketplace_listings.is_nft_listing IS 'Flag to distinguish NFT listings from regular items';