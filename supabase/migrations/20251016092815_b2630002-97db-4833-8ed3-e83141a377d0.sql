-- Удаляем дублирующийся индекс idx_game_data_wallet_address
-- Оставляем idx_game_data_wallet, так как он короче и был создан раньше
DROP INDEX IF EXISTS public.idx_game_data_wallet_address;