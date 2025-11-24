-- Fix UUID type casting in apply_battle_rewards card health updates
CREATE OR REPLACE FUNCTION public.apply_battle_rewards(
  p_wallet_address TEXT,
  p_ell_reward NUMERIC DEFAULT 0,
  p_experience_reward NUMERIC DEFAULT 0,
  p_items JSONB DEFAULT '[]'::jsonb,
  p_card_kills JSONB DEFAULT '[]'::jsonb,
  p_card_health_updates JSONB DEFAULT '[]'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_balance NUMERIC;
  v_current_exp NUMERIC;
  v_current_level INTEGER;
  v_game_data_id TEXT;
  v_item JSONB;
  v_card_kill JSONB;
  v_card_update JSONB;
  v_items_added INTEGER := 0;
  v_cards_updated INTEGER := 0;
BEGIN
  -- Получаем текущие данные игрока
  SELECT id, balance, account_experience, account_level
  INTO v_game_data_id, v_current_balance, v_current_exp, v_current_level
  FROM game_data
  WHERE wallet_address = p_wallet_address;

  IF v_game_data_id IS NULL THEN
    RAISE EXCEPTION 'Player not found: %', p_wallet_address;
  END IF;

  -- Обновляем баланс и опыт
  UPDATE game_data
  SET 
    balance = balance + p_ell_reward,
    account_experience = account_experience + p_experience_reward,
    updated_at = NOW()
  WHERE wallet_address = p_wallet_address;

  -- Добавляем предметы в инвентарь
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO item_instances (
      wallet_address,
      template_id,
      item_id,
      name,
      type
    )
    VALUES (
      p_wallet_address,
      (v_item->>'template_id')::INTEGER,
      v_item->>'item_id',
      v_item->>'name',
      v_item->>'type'
    );
    v_items_added := v_items_added + 1;
  END LOOP;

  -- Обновляем количество убийств у карт (по card_template_id допустимо, т.к. все карты одного типа убивали вместе)
  FOR v_card_kill IN SELECT * FROM jsonb_array_elements(p_card_kills)
  LOOP
    UPDATE card_instances
    SET monster_kills = monster_kills + (v_card_kill->>'kills')::INTEGER
    WHERE wallet_address = p_wallet_address
      AND card_template_id = v_card_kill->>'card_template_id';
  END LOOP;

  -- Обновляем здоровье и защиту карт по уникальному card_instance_id
  -- CRITICAL FIX: Cast card_instance_id to UUID type to match id column type
  FOR v_card_update IN SELECT * FROM jsonb_array_elements(p_card_health_updates)
  LOOP
    UPDATE card_instances
    SET 
      current_health = (v_card_update->>'current_health')::INTEGER,
      current_defense = (v_card_update->>'current_defense')::INTEGER,
      updated_at = NOW()
    WHERE wallet_address = p_wallet_address
      AND id = (v_card_update->>'card_instance_id')::uuid;
    
    IF FOUND THEN
      v_cards_updated := v_cards_updated + 1;
    END IF;
  END LOOP;

  -- Возвращаем результаты
  RETURN jsonb_build_object(
    'balance_added', p_ell_reward,
    'experience_added', p_experience_reward,
    'items_added', v_items_added,
    'cards_updated', v_cards_updated,
    'new_balance', v_current_balance + p_ell_reward,
    'new_experience', v_current_exp + p_experience_reward
  );
END;
$$;