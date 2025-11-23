-- RPC функция для атомарного применения всех наград за бой
CREATE OR REPLACE FUNCTION public.apply_battle_rewards(
  p_wallet_address TEXT,
  p_ell_reward INTEGER,
  p_experience_reward INTEGER,
  p_items JSONB,
  p_card_kills JSONB,
  p_card_health_updates JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_game_data_id UUID;
  v_current_balance INTEGER;
  v_current_exp INTEGER;
  v_item JSONB;
  v_card_kill JSONB;
  v_health_update JSONB;
  v_items_added INTEGER := 0;
  v_cards_updated INTEGER := 0;
BEGIN
  -- Получаем game_data для игрока
  SELECT id, balance, account_experience INTO v_game_data_id, v_current_balance, v_current_exp
  FROM game_data
  WHERE wallet_address = p_wallet_address
  LIMIT 1;

  IF v_game_data_id IS NULL THEN
    RAISE EXCEPTION 'Game data not found for wallet: %', p_wallet_address;
  END IF;

  -- 1. Начисляем ELL и опыт аккаунта
  UPDATE game_data
  SET 
    balance = balance + p_ell_reward,
    account_experience = account_experience + p_experience_reward,
    account_level = public.get_level_from_xp(account_experience + p_experience_reward),
    updated_at = NOW()
  WHERE id = v_game_data_id;

  RAISE NOTICE 'Updated balance: % -> %, experience: % -> %', 
    v_current_balance, v_current_balance + p_ell_reward,
    v_current_exp, v_current_exp + p_experience_reward;

  -- 2. Добавляем предметы в item_instances
  IF p_items IS NOT NULL AND jsonb_array_length(p_items) > 0 THEN
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
      -- Используем существующую RPC для добавления предметов
      PERFORM public.add_item_instances(
        jsonb_build_array(v_item),
        p_wallet_address
      );
      v_items_added := v_items_added + 1;
    END LOOP;
    RAISE NOTICE 'Added % items', v_items_added;
  END IF;

  -- 3. Обновляем счетчик убийств для карточек
  IF p_card_kills IS NOT NULL AND jsonb_array_length(p_card_kills) > 0 THEN
    FOR v_card_kill IN SELECT * FROM jsonb_array_elements(p_card_kills) LOOP
      UPDATE card_instances
      SET 
        monster_kills = monster_kills + (v_card_kill->>'kills')::INTEGER,
        updated_at = NOW()
      WHERE 
        wallet_address = p_wallet_address 
        AND card_template_id = v_card_kill->>'card_template_id';
      v_cards_updated := v_cards_updated + 1;
    END LOOP;
    RAISE NOTICE 'Updated monster kills for % cards', v_cards_updated;
  END IF;

  -- 4. Обновляем здоровье и броню карточек
  IF p_card_health_updates IS NOT NULL AND jsonb_array_length(p_card_health_updates) > 0 THEN
    FOR v_health_update IN SELECT * FROM jsonb_array_elements(p_card_health_updates) LOOP
      UPDATE card_instances
      SET 
        current_health = (v_health_update->>'current_health')::INTEGER,
        current_defense = (v_health_update->>'current_defense')::INTEGER,
        updated_at = NOW()
      WHERE 
        wallet_address = p_wallet_address 
        AND card_template_id = v_health_update->>'card_template_id';
    END LOOP;
    RAISE NOTICE 'Updated health/defense for cards';
  END IF;

  -- Возвращаем результаты
  RETURN jsonb_build_object(
    'ell_added', p_ell_reward,
    'experience_added', p_experience_reward,
    'items_added', v_items_added,
    'cards_updated', v_cards_updated,
    'new_balance', v_current_balance + p_ell_reward,
    'new_experience', v_current_exp + p_experience_reward
  );
END;
$$;

-- Комментарий к функции
COMMENT ON FUNCTION public.apply_battle_rewards IS 
'Атомарное применение всех наград за бой: ELL, опыт, предметы, счетчики убийств и обновление здоровья карточек';
