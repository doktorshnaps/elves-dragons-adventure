-- Очистка активных рабочих для пользователя mr_bruts.tg
UPDATE public.game_data 
SET active_workers = '[]'::jsonb, 
    updated_at = now()
WHERE wallet_address = 'mr_bruts.tg';