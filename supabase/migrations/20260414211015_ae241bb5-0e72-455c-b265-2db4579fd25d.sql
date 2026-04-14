CREATE OR REPLACE FUNCTION public.resurrect_card_in_medical_bay(p_card_instance_id text, p_wallet_address text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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

  -- Early check: if a non-completed medical_bay row already exists for this card, return error
  IF EXISTS (SELECT 1 FROM medical_bay WHERE card_instance_id = p_card_instance_id::UUID AND is_completed = false) THEN
    RETURN json_build_object('success', false, 'error', 'Карточка уже воскрешается');
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
  
  -- Create medical bay entry with ON CONFLICT safety net
  INSERT INTO medical_bay (
    card_instance_id, wallet_address, user_id,
    placed_at, estimated_completion, heal_rate, is_completed
  ) VALUES (
    p_card_instance_id::UUID, p_wallet_address, v_user_id,
    NOW(), v_estimated_completion, 0, false
  )
  ON CONFLICT (card_instance_id) WHERE is_completed = false DO NOTHING
  RETURNING id INTO v_medical_bay_id;

  -- If INSERT was skipped due to conflict, rollback
  IF v_medical_bay_id IS NULL THEN
    UPDATE game_data SET balance = balance + v_resurrection_cost WHERE wallet_address = p_wallet_address;
    UPDATE card_instances SET is_in_medical_bay = false WHERE id = p_card_instance_id::UUID;
    RETURN json_build_object('success', false, 'error', 'Карточка уже воскрешается');
  END IF;
  
  RETURN json_build_object(
    'success', true,
    'medical_bay_id', v_medical_bay_id,
    'estimated_completion', v_estimated_completion,
    'cost', v_resurrection_cost,
    'new_balance', v_balance - v_resurrection_cost
  );
END;
$function$;