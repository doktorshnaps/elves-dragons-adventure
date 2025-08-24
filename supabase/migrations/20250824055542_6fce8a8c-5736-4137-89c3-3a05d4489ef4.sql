-- Add account level and experience fields to game_data table
ALTER TABLE public.game_data 
ADD COLUMN account_level INTEGER NOT NULL DEFAULT 1,
ADD COLUMN account_experience INTEGER NOT NULL DEFAULT 0;

-- Add index for better performance on account level queries
CREATE INDEX idx_game_data_account_level ON public.game_data(account_level);

-- Update existing users to have proper account level based on any existing experience
-- This ensures backwards compatibility
UPDATE public.game_data 
SET account_level = 1, account_experience = 0 
WHERE account_level IS NULL OR account_experience IS NULL;