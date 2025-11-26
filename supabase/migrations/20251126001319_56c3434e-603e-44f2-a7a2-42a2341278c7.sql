-- Улучшаем remove_card_from_forge_bay_v2: восстанавливаем броню если таймер завершен
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
  v_new_defense INTEGER;
  v_is_completed BOOLEAN;
BEGIN
  -- Get entry data from forge_bay with card stats
  SELECT 
    fb.*,
    ci.current_defense,
    ci.max_defense,
    (fb.estimated_completion <= now()) as timer_completed
  INTO v_entry
  FROM forge_bay fb
  JOIN card_instances ci ON ci.id = fb.card_instance_id
  WHERE fb.card_instance_id = p_card_instance_id
    AND fb.wallet_address = p_wallet_address
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Card not found in forge bay';
  END IF;

  -- Если таймер завершен - восстанавливаем броню до максимума
  IF v_entry.timer_completed THEN
    v_new_defense := v_entry.max_defense;
    v_is_completed := true;
    
    -- Обновляем броню карты до максимума
    UPDATE card_instances
    SET 
      current_defense = v_entry.max_defense,
      updated_at = NOW()
    WHERE id = p_card_instance_id
      AND wallet_address = p_wallet_address;
      
    RAISE NOTICE 'Forge repair completed: card_instance_id=%, defense restored to %', 
      p_card_instance_id, v_entry.max_defense;
  ELSE
    -- Таймер не завершен - оставляем текущую броню
    v_new_defense := v_entry.current_defense;
    v_is_completed := false;
    
    RAISE NOTICE 'Forge repair cancelled: card_instance_id=%, defense unchanged at %', 
      p_card_instance_id, v_entry.current_defense;
  END IF;

  -- Delete all entries from forge_bay for this card (cleanup duplicates)
  DELETE FROM forge_bay
  WHERE card_instance_id = p_card_instance_id
    AND wallet_address = p_wallet_address;

  RETURN jsonb_build_object(
    'success', true,
    'current_defense', v_new_defense,
    'was_completed', v_is_completed
  );
END;
$$;