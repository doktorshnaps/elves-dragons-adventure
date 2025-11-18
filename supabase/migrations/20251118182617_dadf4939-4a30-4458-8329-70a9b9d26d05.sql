-- Fix treasure_hunt_findings RLS policies to prevent public manipulation
-- Drop all permissive INSERT policies that allow public access
DROP POLICY IF EXISTS "Anyone can insert treasure hunt findings" ON public.treasure_hunt_findings;
DROP POLICY IF EXISTS "System can insert findings" ON public.treasure_hunt_findings;
DROP POLICY IF EXISTS "Service role can insert findings" ON public.treasure_hunt_findings;

-- Drop all permissive UPDATE policies that allow public manipulation
DROP POLICY IF EXISTS "Anyone can update treasure hunt findings" ON public.treasure_hunt_findings;
DROP POLICY IF EXISTS "Users can update their own findings" ON public.treasure_hunt_findings;
DROP POLICY IF EXISTS "Service role can update findings" ON public.treasure_hunt_findings;

-- Create restrictive policies that explicitly deny public access
-- Only service_role (which bypasses RLS) can INSERT
CREATE POLICY "Service role only for INSERT"
  ON public.treasure_hunt_findings
  FOR INSERT
  TO public
  WITH CHECK (false);

-- Only service_role (which bypasses RLS) can UPDATE
CREATE POLICY "Service role only for UPDATE"
  ON public.treasure_hunt_findings
  FOR UPDATE
  TO public
  USING (false);

-- Keep SELECT policies for public leaderboard viewing (these are safe)
-- The existing SELECT policies allow viewing the leaderboard, which is intentional