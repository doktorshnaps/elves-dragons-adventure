-- 1) Уникальные ограничения, чтобы исключить дубликаты и поддержать ON CONFLICT-логику, если она где-то используется
CREATE UNIQUE INDEX IF NOT EXISTS referrals_unique_referred_wallet
ON public.referrals (referred_wallet_address);

CREATE UNIQUE INDEX IF NOT EXISTS referrals_unique_pair
ON public.referrals (referrer_wallet_address, referred_wallet_address);

-- 2) Переопределяем add_referral без ON CONFLICT, с безопасной проверкой наличия записи
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
  IF p_referrer_wallet_address IS NULL OR length(trim(p_referrer_wallet_address)) = 0
     OR p_referred_wallet_address IS NULL OR length(trim(p_referred_wallet_address)) = 0 THEN
    RAISE EXCEPTION 'Both wallet addresses are required';
  END IF;

  IF p_referrer_wallet_address = p_referred_wallet_address THEN
    RAISE EXCEPTION 'Cannot refer yourself';
  END IF;

  -- Получаем/создаем user_id для обоих кошельков
  SELECT ensure_game_data_exists(p_referrer_wallet_address) INTO v_referrer_user_id;
  SELECT ensure_game_data_exists(p_referred_wallet_address) INTO v_referred_user_id;

  -- Если уже существует активная привязка для приглашенного — возвращаем понятный ответ
  SELECT * INTO v_existing
  FROM public.referrals
  WHERE referred_wallet_address = p_referred_wallet_address
  LIMIT 1;

  IF v_existing IS NOT NULL THEN
    IF v_existing.is_active = true THEN
      RETURN jsonb_build_object(
        'success', false,
        'code', 'already_referred',
        'message', 'User already has a referrer'
      );
    ELSE
      -- Если запись есть, но неактивна — активируем и обновляем
      UPDATE public.referrals
      SET is_active = true,
          referrer_wallet_address = p_referrer_wallet_address,
          referrer_user_id = v_referrer_user_id,
          referred_user_id = v_referred_user_id,
          updated_at = now()
      WHERE id = v_existing.id;

      RETURN jsonb_build_object(
        'success', true,
        'message', 'Referral reactivated successfully'
      );
    END IF;
  END IF;

  -- Вставляем новую запись
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