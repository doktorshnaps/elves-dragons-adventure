-- Улучшаем remove_card_from_medical_bay_v2: восстанавливаем здоровье если таймер завершен
CREATE OR REPLACE FUNCTION public.remove_card_from_medical_bay_v2(
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
  v_new_health INTEGER;
  v_is_completed BOOLEAN;
BEGIN
  -- Get entry data from medical_bay with card stats
  SELECT 
    mb.*,
    ci.current_health,
    ci.max_health,
    (mb.estimated_completion <= now()) as timer_completed
  INTO v_entry
  FROM medical_bay mb
  JOIN card_instances ci ON ci.id = mb.card_instance_id
  WHERE mb.card_instance_id = p_card_instance_id
    AND mb.wallet_address = p_wallet_address
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Card not found in medical bay';
  END IF;

  -- Если таймер завершен - восстанавливаем здоровье до максимума
  IF v_entry.timer_completed THEN
    v_new_health := v_entry.max_health;
    v_is_completed := true;
    
    -- Обновляем здоровье карты до максимума
    UPDATE card_instances
    SET 
      current_health = v_entry.max_health,
      is_in_medical_bay = false,
      updated_at = NOW()
    WHERE id = p_card_instance_id
      AND wallet_address = p_wallet_address;
      
    RAISE NOTICE 'Medical bay healing completed: card_instance_id=%, health restored to %', 
      p_card_instance_id, v_entry.max_health;
  ELSE
    -- Таймер не завершен - оставляем текущее здоровье
    v_new_health := v_entry.current_health;
    v_is_completed := false;
    
    -- Только снимаем флаг медпункта
    UPDATE card_instances
    SET 
      is_in_medical_bay = false,
      updated_at = NOW()
    WHERE id = p_card_instance_id
      AND wallet_address = p_wallet_address;
      
    RAISE NOTICE 'Medical bay healing cancelled: card_instance_id=%, health unchanged at %', 
      p_card_instance_id, v_entry.current_health;
  END IF;

  -- Delete all entries from medical_bay for this card (cleanup duplicates)
  DELETE FROM medical_bay
  WHERE card_instance_id = p_card_instance_id
    AND wallet_address = p_wallet_address;

  RETURN jsonb_build_object(
    'success', true,
    'current_health', v_new_health,
    'was_completed', v_is_completed
  );
END;
$$;