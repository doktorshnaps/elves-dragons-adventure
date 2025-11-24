-- Создание атомарной функции для назначения рабочего
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
  v_result JSONB;
BEGIN
  -- Проверка входных параметров
  IF p_wallet_address IS NULL OR p_card_instance_id IS NULL OR p_active_worker IS NULL THEN
    RAISE EXCEPTION 'wallet_address, card_instance_id and active_worker required';
  END IF;

  -- Получаем ID game_data
  SELECT id, active_workers INTO v_game_data_id, v_current_workers
  FROM public.game_data
  WHERE wallet_address = p_wallet_address
  LIMIT 1;

  IF v_game_data_id IS NULL THEN
    RAISE EXCEPTION 'Game data not found for wallet: %', p_wallet_address;
  END IF;

  -- 1. Удаляем карточку рабочего из card_instances
  DELETE FROM public.card_instances
  WHERE id = p_card_instance_id
    AND wallet_address = p_wallet_address
    AND card_type = 'workers';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Worker card not found: %', p_card_instance_id;
  END IF;

  -- 2. Добавляем рабочего в active_workers
  IF v_current_workers IS NULL THEN
    v_current_workers := '[]'::JSONB;
  END IF;

  v_current_workers := v_current_workers || jsonb_build_array(p_active_worker);

  UPDATE public.game_data
  SET 
    active_workers = v_current_workers,
    updated_at = NOW()
  WHERE id = v_game_data_id;

  -- 3. Возвращаем обновленные данные
  v_result := jsonb_build_object(
    'success', true,
    'active_workers', v_current_workers,
    'message', 'Worker assigned successfully'
  );

  RETURN v_result;
END;
$$;