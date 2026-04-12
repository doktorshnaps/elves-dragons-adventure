
CREATE OR REPLACE FUNCTION public.add_card_to_forge_bay(p_card_instance_id text, p_wallet_address text DEFAULT NULL::text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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

  -- Lock the card instance row to serialize concurrent calls
  PERFORM id FROM card_instances WHERE id = p_card_instance_id::UUID FOR UPDATE;

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

  -- Use ON CONFLICT to handle race condition gracefully
  INSERT INTO forge_bay (card_instance_id, user_id, wallet_address, repair_rate, placed_at, estimated_completion, is_completed)
  VALUES (p_card_instance_id::UUID, v_user_id, p_wallet_address, v_repair_rate, NOW(), v_estimated_completion, false)
  ON CONFLICT (card_instance_id) WHERE is_completed = false DO NOTHING
  RETURNING id INTO v_entry_id;

  -- If conflict occurred, return existing entry ID
  IF v_entry_id IS NULL THEN
    SELECT id INTO v_entry_id FROM forge_bay
    WHERE card_instance_id = p_card_instance_id::UUID AND is_completed = false;
  END IF;

  RETURN v_entry_id;
END;
$function$;
