-- Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Anyone can view clan members" ON public.clan_members;

-- Replace with a restrictive policy (all access goes through SECURITY DEFINER RPCs)
CREATE POLICY "No direct select on clan_members"
  ON public.clan_members FOR SELECT
  USING (false);