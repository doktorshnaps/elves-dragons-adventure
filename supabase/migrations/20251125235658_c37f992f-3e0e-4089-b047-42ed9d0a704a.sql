-- Создаем RPC функции для медпункта с SECURITY DEFINER для обхода RLS
-- Аналогично функциям кузницы, здоровье должно восстанавливаться через process_medical_bay_healing по таймеру

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
  v_current_health INTEGER;
BEGIN
  -- Get entry data from medical_bay
  SELECT 
    mb.*,
    ci.current_health
  INTO v_entry
  FROM medical_bay mb
  JOIN card_instances ci ON ci.id = mb.card_instance_id
  WHERE mb.card_instance_id = p_card_instance_id
    AND mb.wallet_address = p_wallet_address
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Card not found in medical bay';
  END IF;

  -- ВАЖНО: Не восстанавливаем здоровье здесь
  -- Здоровье должно быть уже восстановлено через process_medical_bay_healing() по таймеру
  v_current_health := v_entry.current_health;

  -- Update card to clear medical bay flag
  UPDATE card_instances
  SET 
    is_in_medical_bay = false,
    updated_at = NOW()
  WHERE id = p_card_instance_id
    AND wallet_address = p_wallet_address;

  -- Delete all entries from medical_bay for this card (cleanup duplicates)
  DELETE FROM medical_bay
  WHERE card_instance_id = p_card_instance_id
    AND wallet_address = p_wallet_address;

  RETURN jsonb_build_object(
    'success', true,
    'current_health', v_current_health
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
BEGIN
  -- Update card to clear medical bay flag without healing
  UPDATE card_instances
  SET 
    is_in_medical_bay = false,
    updated_at = NOW()
  WHERE id = p_card_instance_id
    AND wallet_address = p_wallet_address;

  -- Delete entry from medical_bay
  DELETE FROM medical_bay
  WHERE card_instance_id = p_card_instance_id
    AND wallet_address = p_wallet_address;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Healing stopped without recovery'
  );
END;
$$;

-- Улучшаем process_medical_bay_healing: восстанавливаем здоровье ТОЛЬКО когда таймер завершен
CREATE OR REPLACE FUNCTION public.process_medical_bay_healing()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  medical_record RECORD;
  v_health_restored INTEGER;
  v_new_health INTEGER;
  v_processed_count INTEGER := 0;
BEGIN
  -- Обрабатываем все активные записи в медпункте где время лечения истекло
  FOR medical_record IN 
    SELECT mb.*, ci.current_health, ci.max_health
    FROM medical_bay mb
    JOIN card_instances ci ON ci.id = mb.card_instance_id
    WHERE mb.is_completed = false
      AND mb.estimated_completion <= now()
    ORDER BY mb.placed_at ASC
  LOOP
    -- Полное восстановление здоровья до максимума
    v_new_health := medical_record.max_health;
    v_health_restored := v_new_health - medical_record.current_health;
    
    -- Обновляем здоровье карты до максимума
    UPDATE card_instances
    SET 
      current_health = medical_record.max_health,
      updated_at = now()
    WHERE id = medical_record.card_instance_id;
    
    -- Помечаем лечение как завершенное
    UPDATE medical_bay
    SET 
      is_completed = true,
      updated_at = now()
    WHERE id = medical_record.id
      AND is_completed = false;
    
    v_processed_count := v_processed_count + 1;
    
    RAISE NOTICE 'Processed medical bay entry: card_instance_id=%, health_restored=%, new_health=%', 
      medical_record.card_instance_id, v_health_restored, v_new_health;
  END LOOP;
  
  RAISE NOTICE 'Total medical bay entries processed: %', v_processed_count;
END;
$$;