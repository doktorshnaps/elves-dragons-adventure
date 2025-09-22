-- Clear active workers for mr_bruts.tg again after client fix
UPDATE public.game_data 
SET active_workers = '[]'::jsonb, updated_at = now()
WHERE wallet_address = 'mr_bruts.tg';