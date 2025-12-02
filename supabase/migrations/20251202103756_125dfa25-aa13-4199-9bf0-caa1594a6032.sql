-- Исправляем критический баг: карточки не возвращаются в колоду после извлечения из медпункта/кузницы
-- Проблема: флаг is_in_medical_bay не снимался при досрочном извлечении (до завершения таймера)

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

  -- Если карта не найдена, просто возвращаем success
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
    
    -- Обновляем здоровье карты до максимума И снимаем флаг
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
    -- ✅ ИСПРАВЛЕНИЕ: Таймер не завершен - оставляем текущее здоровье НО СНИМАЕМ ФЛАГ
    v_new_health := v_entry.current_health;
    v_is_completed := false;
    
    UPDATE card_instances
    SET 
      is_in_medical_bay = false,
      updated_at = NOW()
    WHERE id = p_card_instance_id
      AND wallet_address = p_wallet_address;
      
    RAISE NOTICE 'Medical bay healing cancelled: card_instance_id=%, health unchanged at %, flag cleared', 
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

  -- Если карта не найдена, просто возвращаем success
  IF NOT FOUND THEN
    RAISE NOTICE 'Card % not found in forge bay for wallet % - already removed', 
      p_card_instance_id, p_wallet_address;
    
    -- Убедимся что флаг medical bay снят (да, для кузницы тоже используется этот флаг)
    UPDATE card_instances
    SET 
      is_in_medical_bay = false,
      updated_at = NOW()
    WHERE id = p_card_instance_id
      AND wallet_address = p_wallet_address
      AND is_in_medical_bay = true;
    
    RETURN jsonb_build_object(
      'success', true,
      'current_defense', 0,
      'was_completed', false,
      'already_removed', true
    );
  END IF;

  -- Если таймер завершен - восстанавливаем броню до максимума
  IF v_entry.timer_completed THEN
    v_new_defense := v_entry.max_defense;
    v_is_completed := true;
    
    -- Обновляем броню карты до максимума И снимаем флаг
    UPDATE card_instances
    SET 
      current_defense = v_entry.max_defense,
      is_in_medical_bay = false,
      updated_at = NOW()
    WHERE id = p_card_instance_id
      AND wallet_address = p_wallet_address;
      
    RAISE NOTICE 'Forge repair completed: card_instance_id=%, defense restored to %', 
      p_card_instance_id, v_entry.max_defense;
  ELSE
    -- ✅ ИСПРАВЛЕНИЕ: Таймер не завершен - оставляем текущую броню НО СНИМАЕМ ФЛАГ
    v_new_defense := v_entry.current_defense;
    v_is_completed := false;
    
    UPDATE card_instances
    SET 
      is_in_medical_bay = false,
      updated_at = NOW()
    WHERE id = p_card_instance_id
      AND wallet_address = p_wallet_address;
    
    RAISE NOTICE 'Forge repair cancelled: card_instance_id=%, defense unchanged at %, flag cleared', 
      p_card_instance_id, v_entry.current_defense;
  END IF;

  -- Delete all entries from forge_bay for this card (cleanup duplicates)
  DELETE FROM forge_bay
  WHERE card_instance_id = p_card_instance_id
    AND wallet_address = p_wallet_address;

  RETURN jsonb_build_object(
    'success', true,
    'current_defense', v_new_defense,
    'was_completed', v_is_completed,
    'already_removed', false
  );
END;
$$;