-- Add selected_team column to game_data table
ALTER TABLE public.game_data 
ADD COLUMN IF NOT EXISTS selected_team JSONB DEFAULT '[]'::jsonb;