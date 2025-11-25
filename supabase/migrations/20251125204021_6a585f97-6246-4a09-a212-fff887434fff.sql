-- Исправляем логику кузницы: удаление карты НЕ должно восстанавливать броню
-- Броня должна восстанавливаться ТОЛЬКО через process_forge_bay_repair() по истечении таймера

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
  v_current_defense INTEGER;
BEGIN
  -- Get entry data from forge_bay
  SELECT 
    fb.*,
    ci.current_defense
  INTO v_entry
  FROM forge_bay fb
  JOIN card_instances ci ON ci.id = fb.card_instance_id
  WHERE fb.card_instance_id = p_card_instance_id
    AND fb.wallet_address = p_wallet_address
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Card not found in forge bay';
  END IF;

  -- ВАЖНО: Не восстанавливаем броню здесь
  -- Броня должна быть уже восстановлена через process_forge_bay_repair() по таймеру
  v_current_defense := v_entry.current_defense;

  -- Update card to clear medical bay flag
  UPDATE card_instances
  SET 
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
    'current_defense', v_current_defense
  );
END;
$$;

-- Улучшаем process_forge_bay_repair: восстанавливаем броню ТОЛЬКО когда таймер завершен
CREATE OR REPLACE FUNCTION public.process_forge_bay_repair()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  forge_record RECORD;
  v_armor_restored INTEGER;
  v_new_defense INTEGER;
  v_processed_count INTEGER := 0;
BEGIN
  -- Обрабатываем все активные записи в кузнице где время ремонта истекло
  FOR forge_record IN 
    SELECT fb.*, ci.current_defense, ci.max_defense
    FROM forge_bay fb
    JOIN card_instances ci ON ci.id = fb.card_instance_id
    WHERE fb.is_completed = false
      AND fb.estimated_completion <= now()
    ORDER BY fb.placed_at ASC
  LOOP
    -- Полное восстановление брони до максимума
    v_new_defense := forge_record.max_defense;
    v_armor_restored := v_new_defense - forge_record.current_defense;
    
    -- Обновляем броню карты до максимума
    UPDATE card_instances
    SET 
      current_defense = forge_record.max_defense,
      updated_at = now()
    WHERE id = forge_record.card_instance_id;
    
    -- Помечаем ремонт как завершенный
    UPDATE forge_bay
    SET 
      is_completed = true,
      updated_at = now()
    WHERE id = forge_record.id
      AND is_completed = false;
    
    v_processed_count := v_processed_count + 1;
    
    RAISE NOTICE 'Processed forge bay entry: card_instance_id=%, armor_restored=%, new_defense=%', 
      forge_record.card_instance_id, v_armor_restored, v_new_defense;
  END LOOP;
  
  RAISE NOTICE 'Total forge bay entries processed: %', v_processed_count;
END;
$$;