-- Создаем RPC функцию для удаления карты из кузницы с восстановлением брони
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
  v_armor_restored INTEGER;
  v_new_defense INTEGER;
  v_hours_elapsed NUMERIC;
BEGIN
  -- Получаем данные записи из forge_bay
  SELECT 
    fb.*,
    ci.current_defense,
    ci.max_defense
  INTO v_entry
  FROM forge_bay fb
  JOIN card_instances ci ON ci.id = fb.card_instance_id
  WHERE fb.card_instance_id = p_card_instance_id
    AND fb.wallet_address = p_wallet_address
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Card not found in forge bay';
  END IF;

  -- Вычисляем восстановленную броню
  v_hours_elapsed := EXTRACT(EPOCH FROM (NOW() - v_entry.placed_at)) / 3600;
  v_armor_restored := FLOOR(v_hours_elapsed * v_entry.repair_rate);
  v_new_defense := LEAST(v_entry.current_defense + v_armor_restored, v_entry.max_defense);

  -- Обновляем броню карты и снимаем флаг
  UPDATE card_instances
  SET 
    current_defense = v_new_defense,
    is_in_medical_bay = false,
    updated_at = NOW()
  WHERE id = p_card_instance_id
    AND wallet_address = p_wallet_address;

  -- Удаляем все записи из forge_bay для этой карты
  DELETE FROM forge_bay
  WHERE card_instance_id = p_card_instance_id
    AND wallet_address = p_wallet_address;

  -- Возвращаем результат
  RETURN jsonb_build_object(
    'success', true,
    'armor_restored', v_armor_restored,
    'new_defense', v_new_defense
  );
END;
$$;

-- Создаем RPC функцию для остановки ремонта без восстановления брони
CREATE OR REPLACE FUNCTION public.stop_repair_without_recovery_v2(
  p_card_instance_id UUID,
  p_wallet_address TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Проверяем, что карта есть в кузнице
  IF NOT EXISTS (
    SELECT 1 FROM forge_bay
    WHERE card_instance_id = p_card_instance_id
      AND wallet_address = p_wallet_address
  ) THEN
    RAISE EXCEPTION 'Card not found in forge bay';
  END IF;

  -- Снимаем флаг is_in_medical_bay
  UPDATE card_instances
  SET 
    is_in_medical_bay = false,
    updated_at = NOW()
  WHERE id = p_card_instance_id
    AND wallet_address = p_wallet_address;

  -- Удаляем все записи из forge_bay
  DELETE FROM forge_bay
  WHERE card_instance_id = p_card_instance_id
    AND wallet_address = p_wallet_address;

  -- Возвращаем результат
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Repair stopped without recovery'
  );
END;
$$;