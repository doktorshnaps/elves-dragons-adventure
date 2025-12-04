-- Fix add_card_to_forge_bay: change v_user_id from text to uuid
CREATE OR REPLACE FUNCTION public.add_card_to_forge_bay(
  p_card_instance_id uuid,
  p_repair_hours integer DEFAULT 24,
  p_wallet_address text DEFAULT NULL::text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_user_id uuid;  -- Fixed: was text, now uuid
  v_forge_level integer;
  v_max_slots integer;
  v_current_count integer;
  v_card_exists boolean;
  v_already_in_forge boolean;
  v_already_in_medical boolean;
  v_current_defense integer;
  v_max_defense integer;
  v_repair_rate integer;
  v_estimated_completion timestamp with time zone;
  v_new_id uuid;
BEGIN
  -- Get user_id and forge_level from game_data
  SELECT gd.user_id, COALESCE((gd.building_levels->>'forge')::integer, 1)
  INTO v_user_id, v_forge_level
  FROM game_data gd
  WHERE gd.wallet_address = p_wallet_address;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Пользователь не найден';
  END IF;

  -- Calculate max slots (2 slots per forge level)
  v_max_slots := GREATEST(v_forge_level, 1) * 2;

  -- Count current entries in forge_bay for this user
  SELECT COUNT(*)
  INTO v_current_count
  FROM forge_bay fb
  WHERE fb.wallet_address = p_wallet_address;

  -- Check slot limit
  IF v_current_count >= v_max_slots THEN
    RAISE EXCEPTION 'Все слоты ремонта заняты (% из %)', v_current_count, v_max_slots;
  END IF;

  -- Check if card exists and belongs to user
  SELECT EXISTS(
    SELECT 1 FROM card_instances 
    WHERE id = p_card_instance_id AND wallet_address = p_wallet_address
  ) INTO v_card_exists;

  IF NOT v_card_exists THEN
    RAISE EXCEPTION 'Карта не найдена или не принадлежит вам';
  END IF;

  -- Check if card is already in forge_bay
  SELECT EXISTS(
    SELECT 1 FROM forge_bay WHERE card_instance_id = p_card_instance_id
  ) INTO v_already_in_forge;

  IF v_already_in_forge THEN
    RAISE EXCEPTION 'Эта карта уже в кузнице';
  END IF;

  -- Check if card is in medical_bay
  SELECT EXISTS(
    SELECT 1 FROM medical_bay WHERE card_instance_id = p_card_instance_id
  ) INTO v_already_in_medical;

  IF v_already_in_medical THEN
    RAISE EXCEPTION 'Эта карта сейчас в медпункте';
  END IF;

  -- Get card defense values
  SELECT current_defense, max_defense
  INTO v_current_defense, v_max_defense
  FROM card_instances
  WHERE id = p_card_instance_id;

  -- Check if card needs repair
  IF v_current_defense >= v_max_defense THEN
    RAISE EXCEPTION 'Карта не нуждается в ремонте';
  END IF;

  -- Calculate repair rate: 1 defense per minute
  v_repair_rate := 1;
  
  -- Calculate estimated completion time
  v_estimated_completion := NOW() + ((v_max_defense - v_current_defense) * INTERVAL '1 minute');

  -- Insert into forge_bay
  INSERT INTO forge_bay (
    card_instance_id,
    user_id,
    wallet_address,
    placed_at,
    repair_rate,
    estimated_completion,
    is_completed
  ) VALUES (
    p_card_instance_id,
    v_user_id,
    p_wallet_address,
    NOW(),
    v_repair_rate,
    v_estimated_completion,
    false
  )
  RETURNING id INTO v_new_id;

  -- Mark card as in forge (using is_in_medical_bay field for now as indicator of being busy)
  UPDATE card_instances
  SET is_in_medical_bay = true
  WHERE id = p_card_instance_id;

  RETURN v_new_id::text;
END;
$function$;