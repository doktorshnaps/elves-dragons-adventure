
-- 1. Clean up completed forge_bay entries and reset card flags
DO $$
DECLARE
  cleaned_count INTEGER := 0;
BEGIN
  -- Remove completed entries from forge_bay and reset card flags
  UPDATE card_instances ci
  SET is_in_medical_bay = false
  FROM forge_bay fb
  WHERE fb.card_instance_id = ci.id
    AND fb.is_completed = true;
  
  GET DIAGNOSTICS cleaned_count = ROW_COUNT;
  RAISE NOTICE 'Reset flags for % cards from completed forge entries', cleaned_count;
  
  -- Delete completed forge_bay entries
  DELETE FROM forge_bay WHERE is_completed = true;
  
  GET DIAGNOSTICS cleaned_count = ROW_COUNT;
  RAISE NOTICE 'Deleted % completed forge_bay entries', cleaned_count;
END $$;

-- 2. Clean up completed medical_bay entries and reset card flags  
DO $$
DECLARE
  cleaned_count INTEGER := 0;
BEGIN
  -- Remove completed entries from medical_bay and reset card flags
  UPDATE card_instances ci
  SET is_in_medical_bay = false
  FROM medical_bay mb
  WHERE mb.card_instance_id = ci.id
    AND mb.is_completed = true;
  
  GET DIAGNOSTICS cleaned_count = ROW_COUNT;
  RAISE NOTICE 'Reset flags for % cards from completed medical entries', cleaned_count;
  
  -- Delete completed medical_bay entries
  DELETE FROM medical_bay WHERE is_completed = true;
  
  GET DIAGNOSTICS cleaned_count = ROW_COUNT;
  RAISE NOTICE 'Deleted % completed medical_bay entries', cleaned_count;
END $$;

-- 3. Reset orphaned card flags (cards marked as in bay but have no active entry)
UPDATE card_instances ci
SET is_in_medical_bay = false
WHERE ci.is_in_medical_bay = true
  AND NOT EXISTS (
    SELECT 1 FROM medical_bay mb 
    WHERE mb.card_instance_id = ci.id AND mb.is_completed = false
  )
  AND NOT EXISTS (
    SELECT 1 FROM forge_bay fb 
    WHERE fb.card_instance_id = ci.id AND fb.is_completed = false
  );

-- 4. Fix remove_card_from_forge_bay_v2 to properly delete entry
CREATE OR REPLACE FUNCTION public.remove_card_from_forge_bay_v2(
  p_card_instance_id UUID,
  p_wallet_address TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_forge_entry RECORD;
  v_final_defense INTEGER;
  v_was_completed BOOLEAN;
BEGIN
  -- Get forge entry
  SELECT * INTO v_forge_entry
  FROM forge_bay
  WHERE card_instance_id = p_card_instance_id
    AND wallet_address = p_wallet_address;
    
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Card not found in forge bay');
  END IF;
  
  v_was_completed := v_forge_entry.is_completed OR (v_forge_entry.estimated_completion <= NOW());
  
  -- Get final defense (max if completed, current if not)
  IF v_was_completed THEN
    SELECT max_defense INTO v_final_defense
    FROM card_instances
    WHERE id = p_card_instance_id;
  ELSE
    SELECT current_defense INTO v_final_defense
    FROM card_instances
    WHERE id = p_card_instance_id;
  END IF;
  
  -- Update card instance - restore defense if completed, reset flag
  UPDATE card_instances
  SET 
    current_defense = CASE WHEN v_was_completed THEN max_defense ELSE current_defense END,
    is_in_medical_bay = false,
    updated_at = NOW()
  WHERE id = p_card_instance_id;
  
  -- Delete entry from forge_bay (not just mark completed!)
  DELETE FROM forge_bay
  WHERE card_instance_id = p_card_instance_id
    AND wallet_address = p_wallet_address;
  
  RETURN jsonb_build_object(
    'success', true,
    'current_defense', v_final_defense,
    'was_completed', v_was_completed
  );
END;
$function$;

-- 5. Fix remove_card_from_medical_bay to properly delete entry
CREATE OR REPLACE FUNCTION public.remove_card_from_medical_bay(
  p_card_instance_id UUID,
  p_wallet_address TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_medical_entry RECORD;
  v_final_health INTEGER;
  v_was_completed BOOLEAN;
BEGIN
  -- Get medical entry
  SELECT * INTO v_medical_entry
  FROM medical_bay
  WHERE card_instance_id = p_card_instance_id
    AND wallet_address = p_wallet_address;
    
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Card not found in medical bay');
  END IF;
  
  v_was_completed := v_medical_entry.is_completed OR (v_medical_entry.estimated_completion <= NOW());
  
  -- Get final health (max if completed, current if not)
  IF v_was_completed THEN
    SELECT max_health INTO v_final_health
    FROM card_instances
    WHERE id = p_card_instance_id;
  ELSE
    SELECT current_health INTO v_final_health
    FROM card_instances
    WHERE id = p_card_instance_id;
  END IF;
  
  -- Update card instance - restore health if completed, reset flag
  UPDATE card_instances
  SET 
    current_health = CASE WHEN v_was_completed THEN max_health ELSE current_health END,
    is_in_medical_bay = false,
    updated_at = NOW()
  WHERE id = p_card_instance_id;
  
  -- Delete entry from medical_bay (not just mark completed!)
  DELETE FROM medical_bay
  WHERE card_instance_id = p_card_instance_id
    AND wallet_address = p_wallet_address;
  
  RETURN jsonb_build_object(
    'success', true,
    'current_health', v_final_health,
    'was_completed', v_was_completed
  );
END;
$function$;

-- 6. Grant execute permissions
GRANT EXECUTE ON FUNCTION public.remove_card_from_forge_bay_v2(UUID, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.remove_card_from_medical_bay(UUID, TEXT) TO anon, authenticated;
