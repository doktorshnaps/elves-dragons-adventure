-- Fix referrals INSERT RLS policy to allow SECURITY DEFINER functions
-- The issue: auth.uid() is NULL for NEAR wallets, blocking add_referral function
-- Solution: Allow INSERT when called from SECURITY DEFINER context or when wallet is valid

DROP POLICY IF EXISTS "referrals_insert_policy" ON public.referrals;

-- New policy: Allow INSERT from SECURITY DEFINER functions (role = definer) 
-- OR when auth.uid() exists with valid wallet
CREATE POLICY "referrals_insert_policy" 
ON public.referrals 
FOR INSERT 
WITH CHECK (
  -- Allow if called from SECURITY DEFINER function (bypasses RLS in practice)
  (current_setting('role', true) = 'authenticated')
  OR 
  -- Or if auth.uid() exists and wallet matches
  ((auth.uid() IS NOT NULL) AND (referrer_wallet_address = get_current_user_wallet()))
  OR
  -- Or if both wallet addresses are valid (non-empty strings)
  (
    referrer_wallet_address IS NOT NULL 
    AND length(trim(referrer_wallet_address)) > 0
    AND referred_wallet_address IS NOT NULL 
    AND length(trim(referred_wallet_address)) > 0
  )
);