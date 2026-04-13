
CREATE OR REPLACE FUNCTION public.add_card_to_medical_bay(p_card_instance_id text, p_wallet_address text DEFAULT NULL::text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id UUID;
  v_entry_id UUID;
  v_existing_id UUID;
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

  -- Check if already in forge
  IF EXISTS(SELECT 1 FROM forge_bay WHERE card_instance_id = p_card_instance_id::UUID AND is_completed = false) THEN
    RAISE EXCEPTION 'Эта карта сейчас в кузнице';
  END IF;

  -- Lock the card instance row to prevent race conditions
  SELECT max_health, current_health INTO v_max_health, v_current_health
  FROM card_instances WHERE id = p_card_instance_id::UUID AND wallet_address = p_wallet_address
  FOR UPDATE;
  
  IF v_max_health IS NULL THEN RAISE EXCEPTION 'Card instance not found'; END IF;

  v_health_to_heal := v_max_health - v_current_health;
  IF v_health_to_heal <= 0 THEN RAISE EXCEPTION 'Card does not need healing'; END IF;

  v_heal_minutes := v_health_to_heal::FLOAT / v_heal_rate;
  v_estimated_completion := NOW() + (v_heal_minutes || ' minutes')::INTERVAL;

  UPDATE card_instances SET is_in_medical_bay = true, medical_bay_start_time = NOW(), medical_bay_heal_rate = v_heal_rate, updated_at = NOW()
  WHERE id = p_card_instance_id::UUID;

  -- Atomic insert with ON CONFLICT to prevent duplicate key errors
  INSERT INTO medical_bay (card_instance_id, user_id, wallet_address, heal_rate, placed_at, estimated_completion, is_completed)
  VALUES (p_card_instance_id::UUID, v_user_id, p_wallet_address, v_heal_rate, NOW(), v_estimated_completion, false)
  ON CONFLICT (card_instance_id) WHERE is_completed = false
  DO NOTHING
  RETURNING id INTO v_entry_id;

  -- If insert was skipped (already exists), return the existing entry ID
  IF v_entry_id IS NULL THEN
    SELECT id INTO v_existing_id FROM medical_bay
    WHERE card_instance_id = p_card_instance_id::UUID AND is_completed = false
    LIMIT 1;
    RETURN v_existing_id::text;
  END IF;

  RETURN v_entry_id::text;
END;
$function$;
