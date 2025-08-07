-- Add battle_state column to persist battle state in Supabase
ALTER TABLE public.game_data
ADD COLUMN IF NOT EXISTS battle_state jsonb;