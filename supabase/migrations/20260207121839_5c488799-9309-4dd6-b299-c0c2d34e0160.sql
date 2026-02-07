-- Drop the old 5-arg overload that conflicts with the newer 6-arg version
DROP FUNCTION IF EXISTS public.admin_update_pvp_season(text, uuid, text, timestamptz, jsonb);
