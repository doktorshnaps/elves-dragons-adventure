-- Secure treasure_hunt_findings table by restricting public write access
-- Only service role can INSERT/UPDATE, but everyone can SELECT for leaderboard display

-- Drop existing permissive policies
DROP POLICY IF EXISTS "Anyone can insert findings" ON public.treasure_hunt_findings;
DROP POLICY IF EXISTS "Anyone can update findings" ON public.treasure_hunt_findings;
DROP POLICY IF EXISTS "Anyone can view findings" ON public.treasure_hunt_findings;

-- Create secure policies
-- Allow everyone to view findings for leaderboard display
CREATE POLICY "Public can view treasure hunt findings"
ON public.treasure_hunt_findings
FOR SELECT
TO public
USING (true);

-- Only authenticated users can view their own findings for detailed queries
CREATE POLICY "Users can view their own findings"
ON public.treasure_hunt_findings
FOR SELECT
TO authenticated
USING (wallet_address = get_current_user_wallet());

-- Only service role (server-side) can insert findings
CREATE POLICY "Service role can insert findings"
ON public.treasure_hunt_findings
FOR INSERT
TO service_role
WITH CHECK (true);

-- Only service role can update findings
CREATE POLICY "Service role can update findings"
ON public.treasure_hunt_findings
FOR UPDATE
TO service_role
USING (true);