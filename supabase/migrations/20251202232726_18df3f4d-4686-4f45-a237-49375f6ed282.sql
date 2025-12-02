-- RPC функция для воскрешения мёртвой карточки
-- Стоимость: 100 ELL, время: 1 час, результат: 50% здоровья
CREATE OR REPLACE FUNCTION public.resurrect_card_in_medical_bay(
  p_card_instance_id UUID,
  p_wallet_address TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_balance INTEGER;
  v_resurrection_cost INTEGER := 100;
  v_card_instance RECORD;
  v_medical_bay_id UUID;
  v_estimated_completion TIMESTAMPTZ;
BEGIN
  -- Проверяем баланс игрока
  SELECT balance INTO v_balance
  FROM game_data
  WHERE wallet_address = p_wallet_address;
  
  IF v_balance IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Игрок не найден');
  END IF;
  
  IF v_balance < v_resurrection_cost THEN
    RETURN json_build_object('success', false, 'error', 'Недостаточно ELL для воскрешения');
  END IF;
  
  -- Получаем информацию о карточке
  SELECT id, current_health, max_health, is_in_medical_bay
  INTO v_card_instance
  FROM card_instances
  WHERE id = p_card_instance_id AND wallet_address = p_wallet_address;
  
  IF v_card_instance.id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Карточка не найдена');
  END IF;
  
  -- Проверяем, что карточка мёртва (current_health = 0)
  IF v_card_instance.current_health > 0 THEN
    RETURN json_build_object('success', false, 'error', 'Карточка не мёртва');
  END IF;
  
  -- Проверяем, что карточка не в медпункте
  IF v_card_instance.is_in_medical_bay THEN
    RETURN json_build_object('success', false, 'error', 'Карточка уже в медпункте');
  END IF;
  
  -- Время завершения: 1 час
  v_estimated_completion := NOW() + INTERVAL '1 hour';
  
  -- Списываем ELL
  UPDATE game_data
  SET balance = balance - v_resurrection_cost
  WHERE wallet_address = p_wallet_address;
  
  -- Помечаем карточку как находящуюся в медпункте
  UPDATE card_instances
  SET is_in_medical_bay = true,
      medical_bay_start_time = NOW(),
      medical_bay_heal_rate = 0 -- 0 означает воскрешение, не лечение
  WHERE id = p_card_instance_id;
  
  -- Получаем auth.uid() если есть
  DECLARE
    v_user_id UUID;
  BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
      -- Получаем user_id из game_data
      SELECT user_id INTO v_user_id FROM game_data WHERE wallet_address = p_wallet_address LIMIT 1;
    END IF;
    
    -- Создаём запись в medical_bay с heal_rate = 0 (маркер воскрешения)
    INSERT INTO medical_bay (
      card_instance_id,
      wallet_address,
      user_id,
      placed_at,
      estimated_completion,
      heal_rate,
      is_completed
    ) VALUES (
      p_card_instance_id,
      p_wallet_address,
      v_user_id,
      NOW(),
      v_estimated_completion,
      0, -- heal_rate = 0 означает воскрешение
      false
    )
    RETURNING id INTO v_medical_bay_id;
  END;
  
  RETURN json_build_object(
    'success', true,
    'medical_bay_id', v_medical_bay_id,
    'estimated_completion', v_estimated_completion,
    'cost', v_resurrection_cost,
    'new_balance', v_balance - v_resurrection_cost
  );
END;
$$;

-- RPC функция для завершения воскрешения (забрать карточку)
CREATE OR REPLACE FUNCTION public.complete_resurrection(
  p_card_instance_id UUID,
  p_wallet_address TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_medical_entry RECORD;
  v_card_instance RECORD;
  v_new_health INTEGER;
BEGIN
  -- Получаем запись медпункта
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
  
  -- Проверяем, что это воскрешение (heal_rate = 0)
  IF v_medical_entry.heal_rate != 0 THEN
    RETURN json_build_object('success', false, 'error', 'Это не запись воскрешения');
  END IF;
  
  -- Проверяем, завершился ли таймер
  IF v_medical_entry.estimated_completion > NOW() THEN
    RETURN json_build_object('success', false, 'error', 'Воскрешение ещё не завершено');
  END IF;
  
  -- Получаем max_health карточки
  SELECT max_health INTO v_card_instance
  FROM card_instances
  WHERE id = p_card_instance_id;
  
  -- Вычисляем 50% здоровья
  v_new_health := GREATEST(1, v_card_instance.max_health / 2);
  
  -- Обновляем здоровье карточки
  UPDATE card_instances
  SET current_health = v_new_health,
      is_in_medical_bay = false,
      medical_bay_start_time = NULL,
      medical_bay_heal_rate = NULL
  WHERE id = p_card_instance_id;
  
  -- Удаляем запись из medical_bay
  DELETE FROM medical_bay WHERE id = v_medical_entry.id;
  
  RETURN json_build_object(
    'success', true,
    'new_health', v_new_health,
    'max_health', v_card_instance.max_health
  );
END;
$$;