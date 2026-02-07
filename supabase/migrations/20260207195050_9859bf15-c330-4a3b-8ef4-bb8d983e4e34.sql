
-- Fix 1: Add search_path to update_treasure_hunt_updated_at function
CREATE OR REPLACE FUNCTION public.update_treasure_hunt_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Fix 2: Block direct SELECT on pvp_ratings (all access goes through SECURITY DEFINER RPCs)
DROP POLICY IF EXISTS "Anyone can view pvp ratings" ON public.pvp_ratings;

CREATE POLICY "No direct select on pvp_ratings"
  ON public.pvp_ratings FOR SELECT
  USING (false);
