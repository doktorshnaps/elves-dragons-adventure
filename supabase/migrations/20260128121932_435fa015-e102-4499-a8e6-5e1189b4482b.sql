
-- Пересоздаем функцию с автоматическим расчётом таймера на основе 100 HP/мин
DROP FUNCTION IF EXISTS public.add_card_to_medical_bay(UUID, INT, TEXT);

CREATE OR REPLACE FUNCTION public.add_card_to_medical_bay(
  p_card_instance_id UUID,
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
  v_heal_rate FLOAT := 100.0; -- 100 HP в минуту (фиксированная скорость)
  v_max_health INT;
  v_current_health INT;
  v_health_to_heal INT;
  v_heal_minutes FLOAT;
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

  -- Расчёт времени: HP / 100 HP в минуту = минуты
  v_heal_minutes := v_health_to_heal::FLOAT / v_heal_rate;
  v_estimated_completion := NOW() + (v_heal_minutes || ' minutes')::INTERVAL;

  UPDATE card_instances SET is_in_medical_bay = true, medical_bay_start_time = NOW(), medical_bay_heal_rate = v_heal_rate, updated_at = NOW()
  WHERE id = p_card_instance_id;

  INSERT INTO medical_bay (card_instance_id, user_id, wallet_address, heal_rate, placed_at, estimated_completion, is_completed)
  VALUES (p_card_instance_id, v_user_id, p_wallet_address, v_heal_rate, NOW(), v_estimated_completion, false)
  RETURNING id INTO v_entry_id;

  RETURN v_entry_id;
END;
$$;
