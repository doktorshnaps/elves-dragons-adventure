-- Исправляем функцию add_card_to_forge_bay чтобы работать идентично add_card_to_medical_bay
CREATE OR REPLACE FUNCTION public.add_card_to_forge_bay(
  p_card_instance_id uuid,
  p_repair_hours integer DEFAULT 24,
  p_wallet_address text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_wallet text;
  v_entry_id uuid;
  v_card_current_defense integer;
  v_card_max_defense integer;
  v_estimated_completion timestamp with time zone;
  v_repair_rate integer;
  v_existing_entry_id uuid;
  v_missing_defense integer;
  v_minutes_needed integer;
BEGIN
  -- Получаем user_id из game_data (как в medical bay)
  v_wallet := COALESCE(p_wallet_address, get_current_user_wallet());
  
  IF v_wallet IS NULL THEN
    RAISE EXCEPTION 'Wallet address is required';
  END IF;
  
  SELECT user_id INTO v_user_id
  FROM game_data
  WHERE wallet_address = v_wallet
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Проверяем, что карта не находится уже в кузнице
  SELECT id INTO v_existing_entry_id
  FROM forge_bay
  WHERE card_instance_id = p_card_instance_id
    AND is_completed = false
    AND wallet_address = v_wallet;

  IF v_existing_entry_id IS NOT NULL THEN
    RAISE EXCEPTION 'Card is already in forge bay';
  END IF;

  -- Получаем текущую и максимальную броню карты (используем только wallet_address как в medical bay)
  SELECT current_defense, max_defense
  INTO v_card_current_defense, v_card_max_defense
  FROM card_instances
  WHERE id = p_card_instance_id
    AND wallet_address = v_wallet;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Card instance not found';
  END IF;

  -- Проверяем, нужно ли восстановление брони
  IF v_card_current_defense >= v_card_max_defense THEN
    RAISE EXCEPTION 'Card armor is already at maximum';
  END IF;

  -- Вычисляем недостающую броню
  v_missing_defense := GREATEST(v_card_max_defense - v_card_current_defense, 0);
  
  IF v_missing_defense = 0 THEN
    v_minutes_needed := 0;
  ELSE
    -- 1 броня = 1 минута
    v_minutes_needed := v_missing_defense;
  END IF;
  
  v_repair_rate := 1; -- 1 единица брони в минуту
  v_estimated_completion := now() + (v_minutes_needed || ' minutes')::interval;

  -- Помечаем карту как находящуюся в кузнице
  UPDATE card_instances
  SET is_in_medical_bay = true,
      updated_at = now()
  WHERE id = p_card_instance_id
    AND wallet_address = v_wallet;

  -- Создаем запись в кузнице
  INSERT INTO forge_bay (
    user_id,
    wallet_address,
    card_instance_id,
    placed_at,
    estimated_completion,
    repair_rate,
    is_completed
  ) VALUES (
    v_user_id,
    v_wallet,
    p_card_instance_id,
    now(),
    v_estimated_completion,
    v_repair_rate,
    false
  )
  RETURNING id INTO v_entry_id;

  RETURN v_entry_id;
END;
$$;