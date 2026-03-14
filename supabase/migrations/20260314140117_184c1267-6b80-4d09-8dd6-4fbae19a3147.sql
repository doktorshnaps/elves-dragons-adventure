
-- Finding 2: Block direct game_data INSERT (service role bypasses RLS)
DROP POLICY IF EXISTS "game_data_insert_policy" ON public.game_data;
CREATE POLICY "game_data_insert_blocked" ON public.game_data
  FOR INSERT TO authenticated, anon
  WITH CHECK (false);

-- Finding 3: Block direct referrals INSERT (handled by SECURITY DEFINER RPC add_referral)
DROP POLICY IF EXISTS "referrals_insert_policy" ON public.referrals;
CREATE POLICY "referrals_insert_blocked" ON public.referrals
  FOR INSERT TO authenticated, anon
  WITH CHECK (false);

-- Finding 4: Fix mgt_claims SELECT - remove spoofable header check
DROP POLICY IF EXISTS "mgt_claims_select_own" ON public.mgt_claims;
CREATE POLICY "mgt_claims_select_own" ON public.mgt_claims
  FOR SELECT TO authenticated
  USING (wallet_address = public.get_current_user_wallet());

-- Finding 5: Restrict soul_donations INSERT to authenticated + own wallet
DROP POLICY IF EXISTS "soul_donations_insert_policy" ON public.soul_donations;
DROP POLICY IF EXISTS "Allow insert soul donations" ON public.soul_donations;
CREATE POLICY "soul_donations_insert_own_wallet" ON public.soul_donations
  FOR INSERT TO authenticated
  WITH CHECK (wallet_address = public.get_current_user_wallet());
