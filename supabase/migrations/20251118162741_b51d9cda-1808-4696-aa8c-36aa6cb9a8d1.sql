-- Fix reward_claims RLS policies to allow admin SELECT access
-- Drop existing deny_all policy
DROP POLICY IF EXISTS "deny_all_reward_claims" ON public.reward_claims;

-- Allow SELECT for admins only
CREATE POLICY "Admins can view reward claims"
ON public.reward_claims
FOR SELECT
TO authenticated
USING (public.is_admin_or_super_wallet(public.get_current_user_wallet()));

-- Prevent all other operations (INSERT/UPDATE/DELETE remain service_role only)
CREATE POLICY "Service role only for write operations"
ON public.reward_claims
FOR ALL
TO authenticated
USING (false)
WITH CHECK (false);

-- Add comment for clarity
COMMENT ON POLICY "Admins can view reward claims" ON public.reward_claims IS 
'Allows administrators to audit reward claims for security monitoring';

-- Fix function search paths for security
-- Update process_referral_earnings to have immutable search_path
CREATE OR REPLACE FUNCTION public.process_referral_earnings()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  referrer_chain record;
  current_level integer := 1;
  max_level integer := 2;
  percentage_level_1 numeric := 0.05;
  percentage_level_2 numeric := 0.025;
  earning_amount integer;
BEGIN
  -- Find the referrer chain for NEW.wallet_address
  FOR referrer_chain IN
    WITH RECURSIVE referrer_tree AS (
      SELECT 
        referrer_wallet_address,
        referred_wallet_address,
        1 as level,
        referrer_user_id
      FROM public.referrals
      WHERE referred_wallet_address = NEW.wallet_address
        AND is_active = true
      
      UNION ALL
      
      SELECT 
        r.referrer_wallet_address,
        r.referred_wallet_address,
        rt.level + 1,
        r.referrer_user_id
      FROM public.referrals r
      INNER JOIN referrer_tree rt ON r.referred_wallet_address = rt.referrer_wallet_address
      WHERE rt.level < max_level
        AND r.is_active = true
    )
    SELECT * FROM referrer_tree
  LOOP
    -- Calculate earning based on level
    IF referrer_chain.level = 1 THEN
      earning_amount := CEIL(NEW.balance * percentage_level_1);
    ELSIF referrer_chain.level = 2 THEN
      earning_amount := CEIL(NEW.balance * percentage_level_2);
    ELSE
      CONTINUE;
    END IF;

    -- Insert earning record
    INSERT INTO public.referral_earnings (
      referrer_wallet_address,
      referrer_user_id,
      referred_wallet_address,
      referred_user_id,
      amount,
      level,
      source_activity
    ) VALUES (
      referrer_chain.referrer_wallet_address,
      referrer_chain.referrer_user_id,
      NEW.wallet_address,
      NEW.user_id,
      earning_amount,
      referrer_chain.level,
      'dungeon'
    );

    -- Update referrer balance
    UPDATE public.game_data
    SET balance = balance + earning_amount
    WHERE wallet_address = referrer_chain.referrer_wallet_address;

  END LOOP;

  RETURN NEW;
END;
$$;

-- Add comment explaining the security definer function
COMMENT ON FUNCTION public.process_referral_earnings() IS 
'Processes referral earnings with fixed search_path for security. Runs as SECURITY DEFINER to bypass RLS.';