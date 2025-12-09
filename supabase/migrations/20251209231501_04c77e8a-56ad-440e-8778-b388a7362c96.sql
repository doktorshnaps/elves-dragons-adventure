-- Drop existing INSERT policy on referral_earnings
DROP POLICY IF EXISTS "Service role only insert" ON public.referral_earnings;
DROP POLICY IF EXISTS "referral_earnings_insert_policy" ON public.referral_earnings;

-- Create strict service role only INSERT policy
CREATE POLICY "Service role only insert" ON public.referral_earnings
FOR INSERT
WITH CHECK (current_setting('role', true) = 'service_role');