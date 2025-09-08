-- Insert admin user data if not exists
INSERT INTO public.game_data (wallet_address, user_id, balance, initialized)
SELECT 'mr_bruts.tg', gen_random_uuid(), 100, true
WHERE NOT EXISTS (
  SELECT 1 FROM public.game_data WHERE wallet_address = 'mr_bruts.tg'
);