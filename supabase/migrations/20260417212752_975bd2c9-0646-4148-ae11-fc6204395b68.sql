
-- 1) Fix complete_resurrection: also restore current_defense, validate ownership, atomic
CREATE OR REPLACE FUNCTION public.complete_resurrection(p_card_instance_id uuid, p_wallet_address text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_medical_entry RECORD;
  v_card_instance RECORD;
  v_new_health INTEGER;
  v_new_defense INTEGER;
BEGIN
  -- Получаем запись медпункта (только владельца)
  SELECT id, heal_rate, is_completed, estimated_completion
  INTO v_medical_entry
  FROM medical_bay
  WHERE card_instance_id = p_card_instance_id 
    AND wallet_address = p_wallet_address
    AND is_completed = false
  ORDER BY placed_at DESC
  LIMIT 1;
  
  IF v_medical_entry.id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Запись воскрешения не найдена');
  END IF;
  
  IF v_medical_entry.heal_rate != 0 THEN
    RETURN json_build_object('success', false, 'error', 'Это не запись воскрешения');
  END IF;
  
  IF v_medical_entry.estimated_completion > NOW() THEN
    RETURN json_build_object('success', false, 'error', 'Воскрешение ещё не завершено');
  END IF;
  
  -- Получаем карту с проверкой владельца
  SELECT id, max_health, max_defense
  INTO v_card_instance
  FROM card_instances
  WHERE id = p_card_instance_id
    AND wallet_address = p_wallet_address;

  IF v_card_instance.id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Карточка не найдена');
  END IF;
  
  v_new_health := GREATEST(1, v_card_instance.max_health / 2);
  v_new_defense := GREATEST(0, v_card_instance.max_defense / 2);
  
  -- Атомарное обновление: здоровье, броня, сброс флагов медпункта
  UPDATE card_instances
  SET current_health = v_new_health,
      current_defense = v_new_defense,
      is_in_medical_bay = false,
      medical_bay_start_time = NULL,
      medical_bay_heal_rate = NULL,
      updated_at = NOW()
  WHERE id = p_card_instance_id
    AND wallet_address = p_wallet_address;
  
  -- Удаляем запись из medical_bay
  DELETE FROM medical_bay WHERE id = v_medical_entry.id;
  
  RETURN json_build_object(
    'success', true,
    'new_health', v_new_health,
    'new_defense', v_new_defense,
    'max_health', v_card_instance.max_health,
    'max_defense', v_card_instance.max_defense
  );
END;
$function$;

-- 2) One-time cleanup of orphan cards: dead/in-medical-bay flag set but no active medical_bay row.
-- Эти карты остаются в неконсистентном состоянии (например, при сбое RPC) и могут пропадать из UI.
UPDATE public.card_instances ci
SET is_in_medical_bay = false,
    medical_bay_start_time = NULL,
    medical_bay_heal_rate = NULL,
    updated_at = NOW()
WHERE is_in_medical_bay = true
  AND NOT EXISTS (
    SELECT 1 FROM public.medical_bay mb
    WHERE mb.card_instance_id = ci.id AND mb.is_completed = false
  );
