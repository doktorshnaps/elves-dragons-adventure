
-- Fix mgt_claims: remove old public-role SELECT policy that uses spoofable header
DROP POLICY IF EXISTS "Users can view their own mgt claims" ON public.mgt_claims;

-- Fix soul_donations: remove old public-role INSERT policy
DROP POLICY IF EXISTS "Users can insert soul donations via wallet" ON public.soul_donations;

-- Fix wallet_connections UPDATE: restrict to own wallet
DROP POLICY IF EXISTS "Users can update own wallet connections" ON public.wallet_connections;
DROP POLICY IF EXISTS "wallet_connections_update_policy" ON public.wallet_connections;
CREATE POLICY "wallet_connections_update_own" ON public.wallet_connections
  FOR UPDATE TO authenticated
  USING (wallet_address = public.get_current_user_wallet())
  WITH CHECK (wallet_address = public.get_current_user_wallet());

-- Fix wallet_connections INSERT: restrict to own wallet
DROP POLICY IF EXISTS "Authenticated users can insert wallet connections" ON public.wallet_connections;
CREATE POLICY "wallet_connections_insert_own" ON public.wallet_connections
  FOR INSERT TO authenticated
  WITH CHECK (wallet_address = public.get_current_user_wallet());
