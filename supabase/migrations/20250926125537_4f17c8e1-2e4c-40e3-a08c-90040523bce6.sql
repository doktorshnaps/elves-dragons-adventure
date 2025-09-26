-- Create referrals table to track referral relationships
CREATE TABLE public.referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_wallet_address TEXT NOT NULL,
  referred_wallet_address TEXT NOT NULL,
  referrer_user_id UUID,
  referred_user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(referred_wallet_address) -- Each user can only be referred once
);

-- Create referral_earnings table to track earnings from referrals
CREATE TABLE public.referral_earnings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_wallet_address TEXT NOT NULL,
  referred_wallet_address TEXT NOT NULL,
  referrer_user_id UUID,
  referred_user_id UUID,
  amount INTEGER NOT NULL,
  level INTEGER NOT NULL, -- 1, 2, or 3 for the referral level
  source_activity TEXT NOT NULL DEFAULT 'dungeon', -- What activity generated the earning
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_earnings ENABLE ROW LEVEL SECURITY;

-- Create policies for referrals table
CREATE POLICY "Users can view their own referrals" 
ON public.referrals 
FOR SELECT 
USING (
  (auth.uid() IS NOT NULL) AND 
  ((referrer_wallet_address = get_current_user_wallet()) OR (referred_wallet_address = get_current_user_wallet()))
);

CREATE POLICY "Users can create referrals" 
ON public.referrals 
FOR INSERT 
WITH CHECK (
  (auth.uid() IS NOT NULL) AND 
  (referrer_wallet_address = get_current_user_wallet())
);

CREATE POLICY "Users can update their own referrals" 
ON public.referrals 
FOR UPDATE 
USING (
  (auth.uid() IS NOT NULL) AND 
  (referrer_wallet_address = get_current_user_wallet())
);

-- Create policies for referral_earnings table
CREATE POLICY "Users can view their own referral earnings" 
ON public.referral_earnings 
FOR SELECT 
USING (
  (auth.uid() IS NOT NULL) AND 
  (referrer_wallet_address = get_current_user_wallet())
);

CREATE POLICY "System can insert referral earnings" 
ON public.referral_earnings 
FOR INSERT 
WITH CHECK (true);

-- Create function to add referral relationship
CREATE OR REPLACE FUNCTION public.add_referral(p_referrer_wallet_address text, p_referred_wallet_address text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_referrer_user_id uuid;
  v_referred_user_id uuid;
  v_result jsonb;
BEGIN
  IF p_referrer_wallet_address IS NULL OR p_referred_wallet_address IS NULL THEN
    RAISE EXCEPTION 'Both wallet addresses are required';
  END IF;
  
  IF p_referrer_wallet_address = p_referred_wallet_address THEN
    RAISE EXCEPTION 'Cannot refer yourself';
  END IF;
  
  -- Get user IDs
  SELECT user_id INTO v_referrer_user_id FROM public.game_data WHERE wallet_address = p_referrer_wallet_address LIMIT 1;
  SELECT user_id INTO v_referred_user_id FROM public.game_data WHERE wallet_address = p_referred_wallet_address LIMIT 1;
  
  IF v_referrer_user_id IS NULL THEN
    RAISE EXCEPTION 'Referrer not found';
  END IF;
  
  IF v_referred_user_id IS NULL THEN
    RAISE EXCEPTION 'Referred user not found';
  END IF;
  
  -- Check if referred user already has a referrer
  IF EXISTS (SELECT 1 FROM public.referrals WHERE referred_wallet_address = p_referred_wallet_address AND is_active = true) THEN
    RAISE EXCEPTION 'User already has a referrer';
  END IF;
  
  -- Insert referral relationship
  INSERT INTO public.referrals (
    referrer_wallet_address,
    referred_wallet_address,
    referrer_user_id,
    referred_user_id
  ) VALUES (
    p_referrer_wallet_address,
    p_referred_wallet_address,
    v_referrer_user_id,
    v_referred_user_id
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Referral added successfully'
  );
END;
$$;

-- Create function to process referral earnings
CREATE OR REPLACE FUNCTION public.process_referral_earnings(p_earner_wallet_address text, p_amount integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_current_wallet text := p_earner_wallet_address;
  v_level integer := 1;
  v_referrer_wallet text;
  v_referrer_user_id uuid;
  v_earning_amount integer;
  v_percentage numeric;
BEGIN
  -- Process up to 3 levels of referrals
  WHILE v_level <= 3 AND v_current_wallet IS NOT NULL LOOP
    -- Get the referrer of the current wallet
    SELECT referrer_wallet_address, referrer_user_id 
    INTO v_referrer_wallet, v_referrer_user_id
    FROM public.referrals 
    WHERE referred_wallet_address = v_current_wallet AND is_active = true
    LIMIT 1;
    
    IF v_referrer_wallet IS NOT NULL THEN
      -- Calculate percentage based on level
      v_percentage := CASE 
        WHEN v_level = 1 THEN 0.06  -- 6%
        WHEN v_level = 2 THEN 0.03  -- 3%
        WHEN v_level = 3 THEN 0.015 -- 1.5%
      END;
      
      v_earning_amount := FLOOR(p_amount * v_percentage);
      
      IF v_earning_amount > 0 THEN
        -- Record the earning
        INSERT INTO public.referral_earnings (
          referrer_wallet_address,
          referred_wallet_address,
          referrer_user_id,
          referred_user_id,
          amount,
          level,
          source_activity
        ) VALUES (
          v_referrer_wallet,
          p_earner_wallet_address,
          v_referrer_user_id,
          (SELECT user_id FROM public.game_data WHERE wallet_address = p_earner_wallet_address LIMIT 1),
          v_earning_amount,
          v_level,
          'dungeon'
        );
        
        -- Add the earning to referrer's balance
        UPDATE public.game_data
        SET balance = balance + v_earning_amount,
            updated_at = now()
        WHERE wallet_address = v_referrer_wallet;
      END IF;
      
      -- Move up the referral chain
      v_current_wallet := v_referrer_wallet;
      v_level := v_level + 1;
    ELSE
      -- No more referrers in the chain
      EXIT;
    END IF;
  END LOOP;
END;
$$;