-- ПУНКТ 2: Триггер для логирования изменений поля cards в game_data
CREATE OR REPLACE FUNCTION public.log_cards_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old_count integer;
  v_new_count integer;
BEGIN
  v_old_count := COALESCE(jsonb_array_length(OLD.cards), 0);
  v_new_count := COALESCE(jsonb_array_length(NEW.cards), 0);
  
  -- Логируем только если количество карточек изменилось
  IF v_old_count != v_new_count THEN
    INSERT INTO public.data_changes (
      table_name,
      record_id,
      wallet_address,
      change_type,
      old_data,
      new_data,
      version_from,
      version_to,
      created_by
    ) VALUES (
      'game_data',
      NEW.id,
      NEW.wallet_address,
      'cards_count_change',
      jsonb_build_object('cards_count', v_old_count),
      jsonb_build_object('cards_count', v_new_count),
      OLD.version,
      NEW.version,
      COALESCE(NEW.wallet_address, 'system')
    );
    
    -- КРИТИЧЕСКОЕ ПРЕДУПРЕЖДЕНИЕ: если карточки уменьшились более чем на 10
    IF v_old_count - v_new_count > 10 THEN
      RAISE WARNING 'CRITICAL: Large card loss detected for wallet %: % -> % cards', 
        NEW.wallet_address, v_old_count, v_new_count;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Удаляем старый триггер если существует
DROP TRIGGER IF EXISTS trigger_log_cards_changes ON public.game_data;

-- Создаем триггер
CREATE TRIGGER trigger_log_cards_changes
  AFTER UPDATE ON public.game_data
  FOR EACH ROW
  EXECUTE FUNCTION public.log_cards_changes();

-- ПУНКТ 3: Усиление защиты в update_game_data_by_wallet_v2
-- Добавляем блокировку уменьшения карточек без флага force
CREATE OR REPLACE FUNCTION public.update_game_data_by_wallet_v2(
  p_wallet_address text,
  p_updates jsonb,
  p_force boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_record record;
  v_current_cards_count integer;
  v_new_cards_count integer;
  v_current_balance integer;
  v_new_balance integer;
  v_result jsonb;
BEGIN
  IF p_wallet_address IS NULL OR length(trim(p_wallet_address)) = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'wallet address required');
  END IF;

  -- Получаем текущие данные
  SELECT * INTO v_current_record
  FROM public.game_data
  WHERE wallet_address = p_wallet_address
  FOR UPDATE;

  IF v_current_record IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'game data not found');
  END IF;

  -- Проверка защиты карточек
  v_current_cards_count := COALESCE(jsonb_array_length(v_current_record.cards), 0);
  
  IF p_updates ? 'cards' THEN
    v_new_cards_count := COALESCE(jsonb_array_length(p_updates->'cards'), 0);
    
    -- ЗАЩИТА: блокируем уменьшение карточек без флага force
    IF NOT p_force AND v_new_cards_count < v_current_cards_count THEN
      -- Разрешаем уменьшение только на 1-2 карточки (продажа/апгрейд)
      IF v_current_cards_count - v_new_cards_count > 2 THEN
        RAISE WARNING 'BLOCKED: Attempt to reduce cards from % to % for wallet % without force flag', 
          v_current_cards_count, v_new_cards_count, p_wallet_address;
        RETURN jsonb_build_object(
          'success', false, 
          'error', 'Cards reduction blocked. Use force=true for bulk operations.',
          'current_count', v_current_cards_count,
          'attempted_count', v_new_cards_count
        );
      END IF;
    END IF;
    
    -- ЗАЩИТА: блокируем запись пустого массива поверх непустого
    IF NOT p_force AND v_new_cards_count = 0 AND v_current_cards_count > 0 THEN
      RAISE WARNING 'BLOCKED: Attempt to clear all cards for wallet % without force flag', p_wallet_address;
      RETURN jsonb_build_object(
        'success', false, 
        'error', 'Cannot clear all cards without force flag',
        'current_count', v_current_cards_count
      );
    END IF;
  END IF;

  -- Проверка защиты баланса
  v_current_balance := COALESCE(v_current_record.balance, 0);
  
  IF p_updates ? 'balance' THEN
    v_new_balance := COALESCE((p_updates->>'balance')::integer, 0);
    
    -- ЗАЩИТА: блокируем обнуление баланса без флага force
    IF NOT p_force AND v_new_balance = 0 AND v_current_balance > 100 THEN
      RAISE WARNING 'BLOCKED: Attempt to zero balance for wallet % (current: %)', 
        p_wallet_address, v_current_balance;
      RETURN jsonb_build_object(
        'success', false, 
        'error', 'Cannot zero balance without force flag',
        'current_balance', v_current_balance
      );
    END IF;
  END IF;

  -- Выполняем обновление
  UPDATE public.game_data
  SET 
    balance = COALESCE((p_updates->>'balance')::integer, balance),
    gold = COALESCE((p_updates->>'gold')::integer, gold),
    wood = COALESCE((p_updates->>'wood')::integer, wood),
    stone = COALESCE((p_updates->>'stone')::integer, stone),
    iron = COALESCE((p_updates->>'iron')::integer, iron),
    cards = COALESCE(p_updates->'cards', cards),
    dragon_eggs = COALESCE(p_updates->'dragon_eggs', dragon_eggs),
    selected_team = COALESCE(p_updates->'selected_team', selected_team),
    active_workers = COALESCE(p_updates->'active_workers', active_workers),
    building_levels = COALESCE(p_updates->'building_levels', building_levels),
    active_building_upgrades = COALESCE(p_updates->'active_building_upgrades', active_building_upgrades),
    battle_state = COALESCE(p_updates->'battle_state', battle_state),
    account_level = COALESCE((p_updates->>'account_level')::integer, account_level),
    account_experience = COALESCE((p_updates->>'account_experience')::integer, account_experience),
    version = COALESCE(version, 0) + 1,
    updated_at = now()
  WHERE wallet_address = p_wallet_address
  RETURNING jsonb_build_object(
    'success', true,
    'version', version,
    'cards_count', jsonb_array_length(cards),
    'balance', balance
  ) INTO v_result;

  RETURN COALESCE(v_result, jsonb_build_object('success', false, 'error', 'update failed'));
END;
$$;