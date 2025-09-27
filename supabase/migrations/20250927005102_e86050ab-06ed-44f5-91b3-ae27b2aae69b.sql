-- Уникальный индекс для поддержки ON CONFLICT (wallet_address) в ensure_game_data_exists
CREATE UNIQUE INDEX IF NOT EXISTS game_data_wallet_address_unique
ON public.game_data (wallet_address)
WHERE wallet_address IS NOT NULL;