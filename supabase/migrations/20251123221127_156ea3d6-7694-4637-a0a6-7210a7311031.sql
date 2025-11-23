-- Manually add wwwwwwwa.near as referral for mr_bruts.tg
-- This is needed because the player registered before the RLS policy fix

DO $$
DECLARE
  v_referrer_user_id uuid;
  v_referred_user_id uuid;
BEGIN
  -- Get user IDs from game_data
  SELECT user_id INTO v_referrer_user_id 
  FROM public.game_data 
  WHERE wallet_address = 'mr_bruts.tg';
  
  SELECT user_id INTO v_referred_user_id 
  FROM public.game_data 
  WHERE wallet_address = 'wwwwwwwa.near';
  
  -- Only insert if both users exist and referral doesn't exist yet
  IF v_referrer_user_id IS NOT NULL AND v_referred_user_id IS NOT NULL THEN
    INSERT INTO public.referrals (
      referrer_wallet_address,
      referred_wallet_address,
      referrer_user_id,
      referred_user_id,
      is_active
    )
    SELECT 
      'mr_bruts.tg',
      'wwwwwwwa.near',
      v_referrer_user_id,
      v_referred_user_id,
      true
    WHERE NOT EXISTS (
      SELECT 1 FROM public.referrals 
      WHERE referred_wallet_address = 'wwwwwwwa.near'
    );
    
    RAISE NOTICE 'Referral added for wwwwwwwa.near → mr_bruts.tg';
  ELSE
    RAISE WARNING 'Could not find user IDs for referral';
  END IF;
END $$;