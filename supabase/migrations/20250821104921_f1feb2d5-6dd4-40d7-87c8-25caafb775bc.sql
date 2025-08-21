
-- Add persistent upgrade queues to game_data
ALTER TABLE public.game_data
  ADD COLUMN IF NOT EXISTS barracks_upgrades jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS dragon_lair_upgrades jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Ensure full row data is available for realtime updates (safe to run multiple times)
ALTER TABLE public.game_data REPLICA IDENTITY FULL;
