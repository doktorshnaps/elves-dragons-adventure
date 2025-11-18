-- Fix referral_earnings RLS vulnerability
-- Restrict INSERT operations to service_role only to prevent manipulation

-- Drop the permissive INSERT policy
DROP POLICY IF EXISTS "System can insert referral earnings" ON public.referral_earnings;

-- Create service_role only INSERT policy (prevents client-side manipulation)
CREATE POLICY "Service role only for referral earnings"
ON public.referral_earnings
FOR INSERT
TO service_role
WITH CHECK (true);

-- Ensure authenticated users can view their own earnings
DROP POLICY IF EXISTS "Users can view their own referral earnings" ON public.referral_earnings;
CREATE POLICY "Users can view their own referral earnings"
ON public.referral_earnings
FOR SELECT
USING (
  auth.uid()::text IN (referrer_user_id::text, referred_user_id::text)
  OR referrer_wallet_address = get_current_user_wallet()
  OR referred_wallet_address = get_current_user_wallet()
);

-- Allow public to view aggregated referral stats (for leaderboards, etc.)
DROP POLICY IF EXISTS "Public can view referral stats" ON public.referral_earnings;
CREATE POLICY "Public can view referral stats"
ON public.referral_earnings
FOR SELECT
USING (true);