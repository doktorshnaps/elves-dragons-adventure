-- Update default turn_timeout_seconds to 60 for new matches
ALTER TABLE public.pvp_matches ALTER COLUMN turn_timeout_seconds SET DEFAULT 60;

-- Update all active matches to use 60-second timeout
UPDATE public.pvp_matches 
SET turn_timeout_seconds = 60 
WHERE status = 'active';