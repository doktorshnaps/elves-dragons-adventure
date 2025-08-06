-- Добавляем колонки для полного игрового состояния
ALTER TABLE public.game_data 
ADD COLUMN IF NOT EXISTS inventory jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS marketplace_listings jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS social_quests jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS adventure_player_stats jsonb DEFAULT NULL,
ADD COLUMN IF NOT EXISTS adventure_current_monster jsonb DEFAULT NULL,
ADD COLUMN IF NOT EXISTS dragon_eggs jsonb DEFAULT '[]'::jsonb;

-- Включаем realtime для обновлений в реальном времени
ALTER TABLE public.game_data REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_data;