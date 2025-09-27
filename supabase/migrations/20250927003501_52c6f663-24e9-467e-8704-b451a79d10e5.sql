-- Исправляем ошибку в функции add_referral (была опечатка p_referenced_wallet_address вместо p_referred_wallet_address)
CREATE OR REPLACE FUNCTION public.add_referral(p_referrer_wallet_address text, p_referred_wallet_address text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_referrer_user_id uuid;
  v_referred_user_id uuid;
BEGIN
  IF p_referrer_wallet_address IS NULL OR p_referred_wallet_address IS NULL THEN
    RAISE EXCEPTION 'Both wallet addresses are required';
  END IF;
  
  IF p_referrer_wallet_address = p_referred_wallet_address THEN
    RAISE EXCEPTION 'Cannot refer yourself';
  END IF;
  
  -- Обеспечиваем существование game_data для обоих пользователей
  SELECT ensure_game_data_exists(p_referrer_wallet_address) INTO v_referrer_user_id;
  SELECT ensure_game_data_exists(p_referred_wallet_address) INTO v_referred_user_id;
  
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
    p_referred_wallet_address,  -- Исправлена опечатка
    v_referrer_user_id,
    v_referred_user_id
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Referral added successfully'
  );
END;
$$;