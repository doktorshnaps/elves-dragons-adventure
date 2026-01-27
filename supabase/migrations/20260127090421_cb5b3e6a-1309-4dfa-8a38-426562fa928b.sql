-- ============================================
-- FIX: Застревание карт в Medical Bay / Forge Bay
-- ============================================

-- 1. Очистка старых completed записей
DELETE FROM medical_bay WHERE is_completed = true;
DELETE FROM forge_bay WHERE is_completed = true;

-- 2. Добавляем partial unique index
DROP INDEX IF EXISTS idx_medical_bay_active_card;
CREATE UNIQUE INDEX idx_medical_bay_active_card 
ON medical_bay(card_instance_id) 
WHERE is_completed = false;

DROP INDEX IF EXISTS idx_forge_bay_active_card;
CREATE UNIQUE INDEX idx_forge_bay_active_card 
ON forge_bay(card_instance_id) 
WHERE is_completed = false;

-- 3. Удаляем ВСЕ старые версии функций
DROP FUNCTION IF EXISTS public.add_card_to_forge_bay(UUID, INT, TEXT);
DROP FUNCTION IF EXISTS public.add_card_to_medical_bay(UUID, INT, TEXT);
DROP FUNCTION IF EXISTS public.process_medical_bay_healing();
DROP FUNCTION IF EXISTS public.process_forge_bay_repair();
DROP FUNCTION IF EXISTS public.cleanup_completed_bay_entries();

-- 4. add_card_to_medical_bay с проверкой дубликатов
CREATE FUNCTION public.add_card_to_medical_bay(
  p_card_instance_id UUID,
  p_heal_hours INT DEFAULT 24,
  p_wallet_address TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_entry_id UUID;
  v_heal_rate FLOAT;
  v_max_health INT;
  v_current_health INT;
  v_health_to_heal INT;
  v_estimated_completion TIMESTAMPTZ;
BEGIN
  SELECT user_id INTO v_user_id FROM game_data WHERE wallet_address = p_wallet_address LIMIT 1;
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'User not found'; END IF;

  IF EXISTS(SELECT 1 FROM medical_bay WHERE card_instance_id = p_card_instance_id AND is_completed = false) THEN
    RAISE EXCEPTION 'Эта карта уже лечится в медпункте';
  END IF;

  IF EXISTS(SELECT 1 FROM forge_bay WHERE card_instance_id = p_card_instance_id AND is_completed = false) THEN
    RAISE EXCEPTION 'Эта карта сейчас в кузнице';
  END IF;

  SELECT max_health, current_health INTO v_max_health, v_current_health
  FROM card_instances WHERE id = p_card_instance_id AND wallet_address = p_wallet_address;
  IF v_max_health IS NULL THEN RAISE EXCEPTION 'Card instance not found'; END IF;

  v_health_to_heal := v_max_health - v_current_health;
  IF v_health_to_heal <= 0 THEN RAISE EXCEPTION 'Card does not need healing'; END IF;

  v_heal_rate := v_health_to_heal::FLOAT / p_heal_hours;
  v_estimated_completion := NOW() + (p_heal_hours || ' hours')::INTERVAL;

  UPDATE card_instances SET is_in_medical_bay = true, medical_bay_start_time = NOW(), medical_bay_heal_rate = v_heal_rate, updated_at = NOW()
  WHERE id = p_card_instance_id;

  INSERT INTO medical_bay (card_instance_id, user_id, wallet_address, heal_rate, placed_at, estimated_completion, is_completed)
  VALUES (p_card_instance_id, v_user_id, p_wallet_address, v_heal_rate, NOW(), v_estimated_completion, false)
  RETURNING id INTO v_entry_id;

  RETURN v_entry_id;
END;
$$;

-- 5. add_card_to_forge_bay с проверкой дубликатов
CREATE FUNCTION public.add_card_to_forge_bay(
  p_card_instance_id UUID,
  p_repair_hours INT DEFAULT 24,
  p_wallet_address TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_entry_id UUID;
  v_repair_rate FLOAT;
  v_max_defense INT;
  v_current_defense INT;
  v_defense_to_repair INT;
  v_estimated_completion TIMESTAMPTZ;
BEGIN
  SELECT user_id INTO v_user_id FROM game_data WHERE wallet_address = p_wallet_address LIMIT 1;
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'User not found'; END IF;

  IF EXISTS(SELECT 1 FROM forge_bay WHERE card_instance_id = p_card_instance_id AND is_completed = false) THEN
    RAISE EXCEPTION 'Эта карта уже ремонтируется в кузнице';
  END IF;

  IF EXISTS(SELECT 1 FROM medical_bay WHERE card_instance_id = p_card_instance_id AND is_completed = false) THEN
    RAISE EXCEPTION 'Эта карта сейчас лечится в медпункте';
  END IF;

  SELECT max_defense, current_defense INTO v_max_defense, v_current_defense
  FROM card_instances WHERE id = p_card_instance_id AND wallet_address = p_wallet_address;
  IF v_max_defense IS NULL THEN RAISE EXCEPTION 'Card instance not found'; END IF;

  v_defense_to_repair := v_max_defense - v_current_defense;
  IF v_defense_to_repair <= 0 THEN RAISE EXCEPTION 'Card does not need repair'; END IF;

  v_repair_rate := v_defense_to_repair::FLOAT / p_repair_hours;
  v_estimated_completion := NOW() + (p_repair_hours || ' hours')::INTERVAL;

  UPDATE card_instances SET is_in_medical_bay = true, updated_at = NOW() WHERE id = p_card_instance_id;

  INSERT INTO forge_bay (card_instance_id, user_id, wallet_address, repair_rate, placed_at, estimated_completion, is_completed)
  VALUES (p_card_instance_id, v_user_id, p_wallet_address, v_repair_rate, NOW(), v_estimated_completion, false)
  RETURNING id INTO v_entry_id;

  RETURN v_entry_id;
END;
$$;

-- 6. process_medical_bay_healing с автоудалением
CREATE FUNCTION public.process_medical_bay_healing()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  medical_record RECORD;
  v_processed_count INTEGER := 0;
BEGIN
  FOR medical_record IN 
    SELECT mb.id, mb.card_instance_id, ci.max_health
    FROM medical_bay mb
    JOIN card_instances ci ON ci.id = mb.card_instance_id
    WHERE mb.is_completed = false AND mb.estimated_completion <= NOW()
  LOOP
    UPDATE card_instances
    SET current_health = medical_record.max_health, is_in_medical_bay = false, medical_bay_start_time = NULL, medical_bay_heal_rate = NULL, last_heal_time = NOW(), updated_at = NOW()
    WHERE id = medical_record.card_instance_id;
    
    DELETE FROM medical_bay WHERE id = medical_record.id;
    v_processed_count := v_processed_count + 1;
  END LOOP;
  RETURN v_processed_count;
END;
$$;

-- 7. process_forge_bay_repair с автоудалением
CREATE FUNCTION public.process_forge_bay_repair()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  forge_record RECORD;
  v_processed_count INTEGER := 0;
BEGIN
  FOR forge_record IN 
    SELECT fb.id, fb.card_instance_id, ci.max_defense
    FROM forge_bay fb
    JOIN card_instances ci ON ci.id = fb.card_instance_id
    WHERE fb.is_completed = false AND fb.estimated_completion <= NOW()
  LOOP
    UPDATE card_instances
    SET current_defense = forge_record.max_defense, is_in_medical_bay = false, updated_at = NOW()
    WHERE id = forge_record.card_instance_id;
    
    DELETE FROM forge_bay WHERE id = forge_record.id;
    v_processed_count := v_processed_count + 1;
  END LOOP;
  RETURN v_processed_count;
END;
$$;

-- 8. Функция очистки застрявших карт
CREATE FUNCTION public.cleanup_completed_bay_entries()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM medical_bay WHERE is_completed = true AND updated_at < NOW() - INTERVAL '1 hour';
  DELETE FROM forge_bay WHERE is_completed = true AND updated_at < NOW() - INTERVAL '1 hour';
  
  UPDATE card_instances ci SET is_in_medical_bay = false
  WHERE ci.is_in_medical_bay = true
    AND NOT EXISTS (SELECT 1 FROM medical_bay mb WHERE mb.card_instance_id = ci.id AND mb.is_completed = false)
    AND NOT EXISTS (SELECT 1 FROM forge_bay fb WHERE fb.card_instance_id = ci.id AND fb.is_completed = false);
END;
$$;

-- 9. Запускаем очистку
SELECT cleanup_completed_bay_entries();