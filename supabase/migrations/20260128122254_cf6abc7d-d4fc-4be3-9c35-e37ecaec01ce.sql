
-- Пересоздаем функцию кузницы с автоматическим расчётом таймера на основе 1 брони/мин
DROP FUNCTION IF EXISTS public.add_card_to_forge_bay(UUID, INT, TEXT);

CREATE OR REPLACE FUNCTION public.add_card_to_forge_bay(
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
  v_repair_rate FLOAT := 1.0; -- 1 броня в минуту (фиксированная скорость)
  v_max_defense INT;
  v_current_defense INT;
  v_defense_to_repair INT;
  v_repair_minutes FLOAT;
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

  -- Расчёт времени: armor / 1 armor в минуту = минуты
  v_repair_minutes := v_defense_to_repair::FLOAT / v_repair_rate;
  v_estimated_completion := NOW() + (v_repair_minutes || ' minutes')::INTERVAL;

  UPDATE card_instances SET is_in_medical_bay = true, updated_at = NOW() WHERE id = p_card_instance_id;

  INSERT INTO forge_bay (card_instance_id, user_id, wallet_address, repair_rate, placed_at, estimated_completion, is_completed)
  VALUES (p_card_instance_id, v_user_id, p_wallet_address, v_repair_rate, NOW(), v_estimated_completion, false)
  RETURNING id INTO v_entry_id;

  RETURN v_entry_id;
END;
$$;
