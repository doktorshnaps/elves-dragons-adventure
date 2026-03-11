
-- Fix 1: player_teams SELECT policy - remove header-based access and open wallet_connections subquery
-- Replace with service_role only approach since all access is via SECURITY DEFINER RPCs
DROP POLICY IF EXISTS "Users can view their own teams" ON public.player_teams;
CREATE POLICY "Users can view their own teams"
  ON public.player_teams
  FOR SELECT
  USING (false);

-- Also lock down INSERT/UPDATE/DELETE since all mutations go through RPCs
DROP POLICY IF EXISTS "Users can insert their own teams" ON public.player_teams;
CREATE POLICY "Users can insert their own teams"
  ON public.player_teams
  FOR INSERT
  WITH CHECK (false);

DROP POLICY IF EXISTS "Users can update their own teams" ON public.player_teams;
CREATE POLICY "Users can update their own teams"
  ON public.player_teams
  FOR UPDATE
  USING (false);

DROP POLICY IF EXISTS "Users can delete their own teams" ON public.player_teams;
CREATE POLICY "Users can delete their own teams"
  ON public.player_teams
  FOR DELETE
  USING (false);

-- Fix 2: wallet_connections INSERT - require authentication
DROP POLICY IF EXISTS "Anyone can insert wallet connections" ON public.wallet_connections;
CREATE POLICY "Authenticated users can insert wallet connections"
  ON public.wallet_connections
  FOR INSERT
  TO authenticated
  WITH CHECK (wallet_address IS NOT NULL);

DROP POLICY IF EXISTS "Anyone can update wallet connections" ON public.wallet_connections;
CREATE POLICY "Authenticated users can update wallet connections"
  ON public.wallet_connections
  FOR UPDATE
  TO authenticated
  USING (wallet_address IS NOT NULL);

-- Fix 3: referrals INSERT - remove the unauthenticated third OR clause
DROP POLICY IF EXISTS "referrals_insert_policy" ON public.referrals;
CREATE POLICY "referrals_insert_policy"
  ON public.referrals
  FOR INSERT
  WITH CHECK (
    -- Allow if called in authenticated context
    (current_setting('role', true) = 'authenticated')
    OR
    -- Or if auth.uid() exists and wallet matches
    ((auth.uid() IS NOT NULL) AND (referrer_wallet_address = get_current_user_wallet()))
  );
