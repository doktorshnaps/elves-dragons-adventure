-- Add active_workers column to game_data table
ALTER TABLE public.game_data 
ADD COLUMN active_workers jsonb NOT NULL DEFAULT '[]'::jsonb;