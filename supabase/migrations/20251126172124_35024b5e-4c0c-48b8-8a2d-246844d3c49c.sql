-- Исправляем обработку ошибок в RPC функциях медпункта
-- Проблема: RAISE EXCEPTION при отсутствии карты вызывает toast error, даже если операция корректна

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

  -- ✅ ИСПРАВЛЕНИЕ: Если карта не найдена, просто возвращаем success
  -- Это не ошибка - карта могла быть уже удалена через Real-time subscription
  IF NOT FOUND THEN
    RAISE NOTICE 'Card % not found in medical bay for wallet % - already removed', 
      p_card_instance_id, p_wallet_address;
    
    -- Убедимся что флаг medical bay снят
    UPDATE card_instances
    SET 
      is_in_medical_bay = false,
      updated_at = NOW()
    WHERE id = p_card_instance_id
      AND wallet_address = p_wallet_address
      AND is_in_medical_bay = true;
    
    RETURN jsonb_build_object(
      'success', true,
      'current_health', 0,
      'was_completed', false,
      'already_removed', true
    );
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
    'was_completed', v_is_completed,
    'already_removed', false
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.stop_healing_without_recovery_v2(
  p_card_instance_id UUID,
  p_wallet_address TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_exists BOOLEAN;
BEGIN
  -- ✅ ИСПРАВЛЕНИЕ: Проверяем существование записи без EXCEPTION
  SELECT EXISTS(
    SELECT 1 FROM medical_bay
    WHERE card_instance_id = p_card_instance_id
      AND wallet_address = p_wallet_address
  ) INTO v_exists;

  IF NOT v_exists THEN
    RAISE NOTICE 'Card % not found in medical bay for wallet % - already removed', 
      p_card_instance_id, p_wallet_address;
  END IF;

  -- Update card to clear medical bay flag without healing
  UPDATE card_instances
  SET 
    is_in_medical_bay = false,
    updated_at = NOW()
  WHERE id = p_card_instance_id
    AND wallet_address = p_wallet_address
    AND is_in_medical_bay = true;

  -- Delete entry from medical_bay (если есть)
  DELETE FROM medical_bay
  WHERE card_instance_id = p_card_instance_id
    AND wallet_address = p_wallet_address;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Healing stopped without recovery',
    'already_removed', NOT v_exists
  );
END;
$$;