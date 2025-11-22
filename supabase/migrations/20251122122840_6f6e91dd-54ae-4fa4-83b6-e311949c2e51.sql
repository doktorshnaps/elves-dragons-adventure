-- Add unique constraint on wallet_address in game_data table
-- This is required for ON CONFLICT (wallet_address) to work in ensure_game_data_exists

ALTER TABLE public.game_data 
ADD CONSTRAINT game_data_wallet_address_key UNIQUE (wallet_address);