-- Add field for active building upgrades to game_data table
ALTER TABLE public.game_data 
ADD COLUMN IF NOT EXISTS active_building_upgrades jsonb DEFAULT '[]'::jsonb;