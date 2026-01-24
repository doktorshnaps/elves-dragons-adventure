-- Add missing columns for bot matches to pvp_matches table
ALTER TABLE public.pvp_matches 
ADD COLUMN IF NOT EXISTS is_bot_match boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS bot_owner_wallet text;