-- Переопределяем add_referral с логированием для отладки
CREATE OR REPLACE FUNCTION public.add_referral(
  p_referrer_wallet_address text,
  p_referred_wallet_address text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_referrer_user_id uuid;
  v_referred_user_id uuid;
  v_existing record;
BEGIN
  RAISE LOG 'ADD_REFERRAL_DEBUG: Starting with referrer=% referred=%', p_referrer_wallet_address, p_referred_wallet_address;

  IF p_referrer_wallet_address IS NULL OR length(trim(p_referrer_wallet_address)) = 0
     OR p_referred_wallet_address IS NULL OR length(trim(p_referred_wallet_address)) = 0 THEN
    RAISE EXCEPTION 'Both wallet addresses are required';
  END IF;

  IF p_referrer_wallet_address = p_referred_wallet_address THEN
    RAISE EXCEPTION 'Cannot refer yourself';
  END IF;

  -- Проверяем существование записей в game_data
  SELECT user_id INTO v_referrer_user_id 
  FROM public.game_data 
  WHERE wallet_address = p_referrer_wallet_address;
  
  IF v_referrer_user_id IS NULL THEN
    RAISE LOG 'ADD_REFERRAL_DEBUG: Creating game_data for referrer %', p_referrer_wallet_address;
    SELECT ensure_game_data_exists(p_referrer_wallet_address) INTO v_referrer_user_id;
  END IF;

  SELECT user_id INTO v_referred_user_id 
  FROM public.game_data 
  WHERE wallet_address = p_referred_wallet_address;
  
  IF v_referred_user_id IS NULL THEN
    RAISE LOG 'ADD_REFERRAL_DEBUG: Creating game_data for referred %', p_referred_wallet_address;
    SELECT ensure_game_data_exists(p_referred_wallet_address) INTO v_referred_user_id;
  END IF;

  RAISE LOG 'ADD_REFERRAL_DEBUG: Got user_ids referrer=% referred=%', v_referrer_user_id, v_referred_user_id;

  -- Проверяем существующие референсы
  SELECT * INTO v_existing
  FROM public.referrals
  WHERE referred_wallet_address = p_referred_wallet_address
  LIMIT 1;

  IF v_existing IS NOT NULL THEN
    RAISE LOG 'ADD_REFERRAL_DEBUG: Found existing referral record id=% active=%', v_existing.id, v_existing.is_active;
    IF v_existing.is_active = true THEN
      RETURN jsonb_build_object(
        'success', false,
        'code', 'already_referred',
        'message', 'User already has a referrer'
      );
    ELSE
      -- Активируем существующую запись
      UPDATE public.referrals
      SET is_active = true,
          referrer_wallet_address = p_referrer_wallet_address,
          referrer_user_id = v_referrer_user_id,
          referred_user_id = v_referred_user_id,
          updated_at = now()
      WHERE id = v_existing.id;

      RAISE LOG 'ADD_REFERRAL_DEBUG: Reactivated existing referral';
      RETURN jsonb_build_object(
        'success', true,
        'message', 'Referral reactivated successfully'
      );
    END IF;
  END IF;

  -- Создаем новую запись
  RAISE LOG 'ADD_REFERRAL_DEBUG: Creating new referral record';
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

  RAISE LOG 'ADD_REFERRAL_DEBUG: Successfully created referral';
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Referral added successfully'
  );
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'ADD_REFERRAL_ERROR: % %', SQLSTATE, SQLERRM;
    RAISE;
END;
$$;