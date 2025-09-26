-- RPCs to read referral data by wallet without requiring client auth (bypass RLS safely)
-- 1) List of referrals where wallet is the referrer
CREATE OR REPLACE FUNCTION public.get_referrals_by_referrer(p_wallet_address text)
RETURNS SETOF public.referrals
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM public.referrals
  WHERE referrer_wallet_address = p_wallet_address
    AND is_active = true
  ORDER BY created_at DESC;
$$;

-- 2) Single record of who referred this wallet
CREATE OR REPLACE FUNCTION public.get_referrer_for_wallet(p_wallet_address text)
RETURNS public.referrals
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r public.referrals%ROWTYPE;
BEGIN
  SELECT * INTO r
  FROM public.referrals
  WHERE referred_wallet_address = p_wallet_address
    AND is_active = true
  ORDER BY created_at DESC
  LIMIT 1;

  RETURN r;
END;
$$;

-- 3) Earnings for referrer wallet
CREATE OR REPLACE FUNCTION public.get_referral_earnings_by_referrer(p_wallet_address text)
RETURNS SETOF public.referral_earnings
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM public.referral_earnings
  WHERE referrer_wallet_address = p_wallet_address
  ORDER BY created_at DESC;
$$;