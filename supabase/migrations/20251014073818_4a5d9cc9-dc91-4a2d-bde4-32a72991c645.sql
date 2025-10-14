-- Add indexes on wallet_address for frequently queried tables
-- This will significantly speed up queries and reduce I/O load

CREATE INDEX IF NOT EXISTS idx_game_data_wallet_address ON public.game_data(wallet_address);
CREATE INDEX IF NOT EXISTS idx_card_instances_wallet_address ON public.card_instances(wallet_address);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_seller_wallet ON public.marketplace_listings(seller_wallet_address) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_buyer_wallet ON public.marketplace_listings(buyer_wallet_address);
CREATE INDEX IF NOT EXISTS idx_medical_bay_wallet ON public.medical_bay(wallet_address);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_wallet ON public.referrals(referrer_wallet_address);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_wallet ON public.referrals(referred_wallet_address);
CREATE INDEX IF NOT EXISTS idx_user_quest_progress_wallet ON public.user_quest_progress(wallet_address);

-- Add composite index for common queries
CREATE INDEX IF NOT EXISTS idx_card_instances_wallet_type ON public.card_instances(wallet_address, card_type);
CREATE INDEX IF NOT EXISTS idx_medical_bay_wallet_completed ON public.medical_bay(wallet_address, is_completed) WHERE is_completed = false;