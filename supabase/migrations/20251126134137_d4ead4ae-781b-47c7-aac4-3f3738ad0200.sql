-- Исправление assign_worker_to_building: улучшенная обработка ошибок и формат ответа
-- Рабочие УДАЛЯЮТСЯ из card_instances при назначении (требование: они должны пропасть из инвентаря)
CREATE OR REPLACE FUNCTION public.assign_worker_to_building(
  p_wallet_address TEXT,
  p_card_instance_id UUID,
  p_active_worker JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_game_data_id UUID;
  v_current_workers JSONB;
  v_worker_exists BOOLEAN;
  v_card_type TEXT;
BEGIN
  -- Проверка входных параметров
  IF p_wallet_address IS NULL OR p_card_instance_id IS NULL OR p_active_worker IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'wallet_address, card_instance_id and active_worker are required'
    );
  END IF;

  -- Проверяем, существует ли рабочий в card_instances
  SELECT card_type INTO v_card_type
  FROM public.card_instances
  WHERE id = p_card_instance_id
    AND wallet_address = p_wallet_address
  LIMIT 1;

  IF v_card_type IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Worker card not found in card_instances'
    );
  END IF;

  IF v_card_type != 'workers' THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Card is not a worker type'
    );
  END IF;

  -- Получаем game_data
  SELECT id, active_workers INTO v_game_data_id, v_current_workers
  FROM public.game_data
  WHERE wallet_address = p_wallet_address
  LIMIT 1;

  IF v_game_data_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Game data not found for wallet'
    );
  END IF;

  -- Проверяем, не назначен ли уже этот рабочий
  IF v_current_workers IS NOT NULL THEN
    -- Проверяем массив active_workers на наличие cardInstanceId
    IF jsonb_typeof(v_current_workers) = 'array' THEN
      FOR i IN 0..jsonb_array_length(v_current_workers)-1 LOOP
        IF (v_current_workers->i->>'cardInstanceId')::UUID = p_card_instance_id THEN
          RETURN jsonb_build_object(
            'success', false,
            'message', 'Worker is already assigned to a building'
          );
        END IF;
      END LOOP;
    END IF;
  END IF;

  -- 1. УДАЛЯЕМ карточку рабочего из card_instances (чтобы пропал из инвентаря)
  DELETE FROM public.card_instances
  WHERE id = p_card_instance_id
    AND wallet_address = p_wallet_address
    AND card_type = 'workers';

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Failed to delete worker card from card_instances'
    );
  END IF;

  RAISE NOTICE 'Worker card deleted from card_instances: %', p_card_instance_id;

  -- 2. Добавляем рабочего в active_workers
  IF v_current_workers IS NULL THEN
    v_current_workers := '[]'::JSONB;
  END IF;

  v_current_workers := v_current_workers || jsonb_build_array(p_active_worker);

  -- 3. Обновляем game_data
  UPDATE public.game_data
  SET 
    active_workers = v_current_workers,
    updated_at = NOW()
  WHERE id = v_game_data_id;

  RAISE NOTICE 'Worker assigned to building successfully';

  -- 4. Возвращаем результат
  RETURN jsonb_build_object(
    'success', true,
    'active_workers', v_current_workers,
    'message', 'Worker assigned successfully'
  );
END;
$$;