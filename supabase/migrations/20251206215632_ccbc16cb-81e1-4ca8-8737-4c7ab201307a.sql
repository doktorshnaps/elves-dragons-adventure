-- Drop the dangerous public SELECT policy that exposes all referral earnings
DROP POLICY IF EXISTS "Public can view referral stats" ON public.referral_earnings;