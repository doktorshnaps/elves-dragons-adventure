
-- Fix add_card_to_medical_bay: add slot limit check
CREATE OR REPLACE FUNCTION public.add_card_to_medical_bay(p_card_instance_id TEXT, p_wallet_address TEXT DEFAULT NULL)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_entry_id UUID;
  v_heal_rate FLOAT := 100.0;
  v_max_health INT;
  v_current_health INT;
  v_health_to_heal INT;
  v_heal_minutes FLOAT;
  v_estimated_completion TIMESTAMPTZ;
  v_active_count INT;
  v_max_slots INT := 3;
BEGIN
  SELECT user_id INTO v_user_id FROM game_data WHERE wallet_address = p_wallet_address LIMIT 1;
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'User not found'; END IF;

  -- Check slot limit
  SELECT count(*) INTO v_active_count FROM medical_bay
  WHERE (wallet_address = p_wallet_address OR user_id = v_user_id) AND is_completed = false;
  
  IF v_active_count >= v_max_slots THEN
    RAISE EXCEPTION 'Все слоты медпункта заняты (максимум %)', v_max_slots;
  END IF;

  IF EXISTS(SELECT 1 FROM medical_bay WHERE card_instance_id = p_card_instance_id::UUID AND is_completed = false) THEN
    RAISE EXCEPTION 'Эта карта уже лечится в медпункте';
  END IF;

  IF EXISTS(SELECT 1 FROM forge_bay WHERE card_instance_id = p_card_instance_id::UUID AND is_completed = false) THEN
    RAISE EXCEPTION 'Эта карта сейчас в кузнице';
  END IF;

  SELECT max_health, current_health INTO v_max_health, v_current_health
  FROM card_instances WHERE id = p_card_instance_id::UUID AND wallet_address = p_wallet_address;
  IF v_max_health IS NULL THEN RAISE EXCEPTION 'Card instance not found'; END IF;

  v_health_to_heal := v_max_health - v_current_health;
  IF v_health_to_heal <= 0 THEN RAISE EXCEPTION 'Card does not need healing'; END IF;

  v_heal_minutes := v_health_to_heal::FLOAT / v_heal_rate;
  v_estimated_completion := NOW() + (v_heal_minutes || ' minutes')::INTERVAL;

  UPDATE card_instances SET is_in_medical_bay = true, medical_bay_start_time = NOW(), medical_bay_heal_rate = v_heal_rate, updated_at = NOW()
  WHERE id = p_card_instance_id::UUID;

  INSERT INTO medical_bay (card_instance_id, user_id, wallet_address, heal_rate, placed_at, estimated_completion, is_completed)
  VALUES (p_card_instance_id::UUID, v_user_id, p_wallet_address, v_heal_rate, NOW(), v_estimated_completion, false)
  RETURNING id INTO v_entry_id;

  RETURN v_entry_id;
END;
$$;

-- Fix add_card_to_forge_bay: add slot limit check based on forge level
CREATE OR REPLACE FUNCTION public.add_card_to_forge_bay(p_card_instance_id TEXT, p_wallet_address TEXT DEFAULT NULL)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_entry_id UUID;
  v_repair_rate FLOAT := 1.0;
  v_max_defense INT;
  v_current_defense INT;
  v_defense_to_repair INT;
  v_repair_minutes FLOAT;
  v_estimated_completion TIMESTAMPTZ;
  v_active_count INT;
  v_forge_level INT;
  v_max_slots INT;
  v_building_levels JSONB;
BEGIN
  SELECT user_id, building_levels::JSONB INTO v_user_id, v_building_levels
  FROM game_data WHERE wallet_address = p_wallet_address LIMIT 1;
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'User not found'; END IF;

  -- Determine forge level and max slots
  v_forge_level := COALESCE((v_building_levels->>'forge')::INT, 0);
  v_max_slots := v_forge_level + 1;

  -- Check slot limit
  SELECT count(*) INTO v_active_count FROM forge_bay
  WHERE (wallet_address = p_wallet_address OR user_id = v_user_id) AND is_completed = false;
  
  IF v_active_count >= v_max_slots THEN
    RAISE EXCEPTION 'Все слоты кузницы заняты (максимум %)', v_max_slots;
  END IF;

  IF EXISTS(SELECT 1 FROM forge_bay WHERE card_instance_id = p_card_instance_id::UUID AND is_completed = false) THEN
    RAISE EXCEPTION 'Эта карта уже ремонтируется в кузнице';
  END IF;

  IF EXISTS(SELECT 1 FROM medical_bay WHERE card_instance_id = p_card_instance_id::UUID AND is_completed = false) THEN
    RAISE EXCEPTION 'Эта карта сейчас лечится в медпункте';
  END IF;

  SELECT max_defense, current_defense INTO v_max_defense, v_current_defense
  FROM card_instances WHERE id = p_card_instance_id::UUID AND wallet_address = p_wallet_address;
  IF v_max_defense IS NULL THEN RAISE EXCEPTION 'Card instance not found'; END IF;

  v_defense_to_repair := v_max_defense - v_current_defense;
  IF v_defense_to_repair <= 0 THEN RAISE EXCEPTION 'Card does not need repair'; END IF;

  v_repair_minutes := v_defense_to_repair::FLOAT / v_repair_rate;
  v_estimated_completion := NOW() + (v_repair_minutes || ' minutes')::INTERVAL;

  UPDATE card_instances SET is_in_medical_bay = true, updated_at = NOW() WHERE id = p_card_instance_id::UUID;

  INSERT INTO forge_bay (card_instance_id, user_id, wallet_address, repair_rate, placed_at, estimated_completion, is_completed)
  VALUES (p_card_instance_id::UUID, v_user_id, p_wallet_address, v_repair_rate, NOW(), v_estimated_completion, false)
  RETURNING id INTO v_entry_id;

  RETURN v_entry_id;
END;
$$;

-- Fix resurrect_card_in_medical_bay: add slot limit check
CREATE OR REPLACE FUNCTION public.resurrect_card_in_medical_bay(p_card_instance_id TEXT, p_wallet_address TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_balance INTEGER;
  v_resurrection_cost INTEGER := 100;
  v_card_instance RECORD;
  v_medical_bay_id UUID;
  v_estimated_completion TIMESTAMPTZ;
  v_active_count INT;
  v_max_slots INT := 3;
  v_user_id UUID;
BEGIN
  -- Check balance
  SELECT balance, user_id INTO v_balance, v_user_id
  FROM game_data
  WHERE wallet_address = p_wallet_address;
  
  IF v_balance IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Игрок не найден');
  END IF;
  
  IF v_balance < v_resurrection_cost THEN
    RETURN json_build_object('success', false, 'error', 'Недостаточно ELL для воскрешения');
  END IF;

  -- Check slot limit
  SELECT count(*) INTO v_active_count FROM medical_bay
  WHERE (wallet_address = p_wallet_address OR user_id = v_user_id) AND is_completed = false;
  
  IF v_active_count >= v_max_slots THEN
    RETURN json_build_object('success', false, 'error', 'Все слоты медпункта заняты (максимум ' || v_max_slots || ')');
  END IF;
  
  -- Get card info
  SELECT id, current_health, max_health, is_in_medical_bay
  INTO v_card_instance
  FROM card_instances
  WHERE id = p_card_instance_id::UUID AND wallet_address = p_wallet_address;
  
  IF v_card_instance.id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Карточка не найдена');
  END IF;
  
  IF v_card_instance.current_health > 0 THEN
    RETURN json_build_object('success', false, 'error', 'Карточка не мёртва');
  END IF;
  
  IF v_card_instance.is_in_medical_bay THEN
    RETURN json_build_object('success', false, 'error', 'Карточка уже в медпункте');
  END IF;
  
  v_estimated_completion := NOW() + INTERVAL '1 hour';
  
  -- Deduct ELL
  UPDATE game_data
  SET balance = balance - v_resurrection_cost
  WHERE wallet_address = p_wallet_address;
  
  -- Mark card as in medical bay
  UPDATE card_instances
  SET is_in_medical_bay = true,
      medical_bay_start_time = NOW(),
      medical_bay_heal_rate = 0
  WHERE id = p_card_instance_id::UUID;
  
  -- Get user_id
  IF v_user_id IS NULL THEN
    v_user_id := auth.uid();
  END IF;
  
  -- Create medical bay entry
  INSERT INTO medical_bay (
    card_instance_id, wallet_address, user_id,
    placed_at, estimated_completion, heal_rate, is_completed
  ) VALUES (
    p_card_instance_id::UUID, p_wallet_address, v_user_id,
    NOW(), v_estimated_completion, 0, false
  )
  RETURNING id INTO v_medical_bay_id;
  
  RETURN json_build_object(
    'success', true,
    'medical_bay_id', v_medical_bay_id,
    'estimated_completion', v_estimated_completion,
    'cost', v_resurrection_cost,
    'new_balance', v_balance - v_resurrection_cost
  );
END;
$$;
