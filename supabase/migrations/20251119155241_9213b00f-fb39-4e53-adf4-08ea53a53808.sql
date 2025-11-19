-- Fix armor restoration logic in forge bay
-- When timer is completed, armor should be fully restored to max_defense

CREATE OR REPLACE FUNCTION public.remove_card_from_forge_bay_v2(
  p_card_instance_id UUID,
  p_wallet_address TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_entry RECORD;
  v_armor_restored INTEGER;
  v_new_defense INTEGER;
  v_hours_elapsed NUMERIC;
  v_repair_completed BOOLEAN;
BEGIN
  -- Get entry data from forge_bay
  SELECT 
    fb.*,
    ci.current_defense,
    ci.max_defense
  INTO v_entry
  FROM forge_bay fb
  JOIN card_instances ci ON ci.id = fb.card_instance_id
  WHERE fb.card_instance_id = p_card_instance_id
    AND fb.wallet_address = p_wallet_address
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Card not found in forge bay';
  END IF;

  -- Check if repair is completed
  v_repair_completed := (v_entry.is_completed = true) OR 
                        (v_entry.estimated_completion IS NOT NULL AND v_entry.estimated_completion <= NOW());

  -- If repair is completed, restore to max_defense
  IF v_repair_completed THEN
    v_new_defense := v_entry.max_defense;
    v_armor_restored := v_entry.max_defense - v_entry.current_defense;
  ELSE
    -- Calculate partial restoration based on elapsed time
    v_hours_elapsed := EXTRACT(EPOCH FROM (NOW() - v_entry.placed_at)) / 3600;
    v_armor_restored := FLOOR(v_hours_elapsed * v_entry.repair_rate / 60.0); -- repair_rate per hour, 1 armor per minute
    v_new_defense := LEAST(v_entry.current_defense + v_armor_restored, v_entry.max_defense);
  END IF;

  -- Update card armor and clear flag
  UPDATE card_instances
  SET 
    current_defense = v_new_defense,
    is_in_medical_bay = false,
    updated_at = NOW()
  WHERE id = p_card_instance_id
    AND wallet_address = p_wallet_address;

  -- Delete all entries from forge_bay for this card (cleanup duplicates)
  DELETE FROM forge_bay
  WHERE card_instance_id = p_card_instance_id
    AND wallet_address = p_wallet_address;

  RETURN jsonb_build_object(
    'success', true,
    'armor_restored', v_armor_restored,
    'new_defense', v_new_defense
  );
END;
$$;

-- Also fix the add_card_to_forge_bay to prevent duplicates
CREATE OR REPLACE FUNCTION public.add_card_to_forge_bay(
  p_card_instance_id UUID,
  p_repair_hours INTEGER DEFAULT 24,
  p_wallet_address TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_wallet TEXT;
  v_entry_id UUID;
  v_estimated_completion TIMESTAMPTZ;
  v_current_defense INTEGER;
  v_max_defense INTEGER;
BEGIN
  -- Get wallet address
  v_wallet := COALESCE(p_wallet_address, get_current_user_wallet());
  
  IF v_wallet IS NULL OR LENGTH(TRIM(v_wallet)) = 0 THEN
    RAISE EXCEPTION 'Wallet address is required';
  END IF;

  -- Get user_id from game_data
  SELECT user_id INTO v_user_id
  FROM game_data
  WHERE wallet_address = v_wallet
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found for wallet address';
  END IF;

  -- Check if card already in forge bay (prevent duplicates)
  IF EXISTS (
    SELECT 1 FROM forge_bay
    WHERE card_instance_id = p_card_instance_id
      AND wallet_address = v_wallet
  ) THEN
    RAISE EXCEPTION 'Card already in forge bay';
  END IF;

  -- Get card defense values
  SELECT current_defense, max_defense
  INTO v_current_defense, v_max_defense
  FROM card_instances
  WHERE id = p_card_instance_id
    AND wallet_address = v_wallet;

  IF v_current_defense IS NULL THEN
    RAISE EXCEPTION 'Card not found';
  END IF;

  -- Calculate estimated completion: 1 armor per minute
  v_estimated_completion := NOW() + (v_max_defense - v_current_defense) * INTERVAL '1 minute';

  -- Insert into forge_bay
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
    NOW(),
    v_estimated_completion,
    60, -- 60 armor per hour = 1 armor per minute
    false
  )
  RETURNING id INTO v_entry_id;

  -- Set card as in medical bay
  UPDATE card_instances
  SET 
    is_in_medical_bay = true,
    updated_at = NOW()
  WHERE id = p_card_instance_id
    AND wallet_address = v_wallet;

  RETURN v_entry_id;
END;
$$;