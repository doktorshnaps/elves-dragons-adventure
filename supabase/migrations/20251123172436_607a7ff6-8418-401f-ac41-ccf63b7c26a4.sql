-- ============================================================
-- ФАЗА 2: RPC для атомарного применения боевых наград
-- ============================================================

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

  -- Обновляем количество убийств у карт
  FOR v_card_kill IN SELECT * FROM jsonb_array_elements(p_card_kills)
  LOOP
    UPDATE card_instances
    SET monster_kills = monster_kills + (v_card_kill->>'kills')::INTEGER
    WHERE wallet_address = p_wallet_address
      AND card_template_id = v_card_kill->>'card_template_id';
  END LOOP;

  -- Обновляем здоровье и защиту карт
  FOR v_card_update IN SELECT * FROM jsonb_array_elements(p_card_health_updates)
  LOOP
    UPDATE card_instances
    SET 
      current_health = (v_card_update->>'current_health')::INTEGER,
      current_defense = (v_card_update->>'current_defense')::INTEGER,
      updated_at = NOW()
    WHERE wallet_address = p_wallet_address
      AND card_template_id = v_card_update->>'card_template_id';
    v_cards_updated := v_cards_updated + 1;
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

-- ============================================================
-- ФАЗА 3: Batch операции для крафта и обновления карт
-- ============================================================

-- RPC для batch крафта предметов
CREATE OR REPLACE FUNCTION public.craft_multiple_items(
  p_wallet_address TEXT,
  p_recipes JSONB -- массив: [{recipe_id, quantity, materials: [{template_id, quantity}]}]
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_recipe JSONB;
  v_recipe_id TEXT;
  v_quantity INTEGER;
  v_materials JSONB;
  v_material JSONB;
  v_result_item_id INTEGER;
  v_result_quantity INTEGER;
  v_total_crafted INTEGER := 0;
  v_game_data_record RECORD;
BEGIN
  -- Получаем данные игрока для проверки ресурсов
  SELECT * INTO v_game_data_record
  FROM game_data
  WHERE wallet_address = p_wallet_address;

  IF v_game_data_record IS NULL THEN
    RAISE EXCEPTION 'Player not found';
  END IF;

  -- Обрабатываем каждый рецепт
  FOR v_recipe IN SELECT * FROM jsonb_array_elements(p_recipes)
  LOOP
    v_recipe_id := v_recipe->>'recipe_id';
    v_quantity := (v_recipe->>'quantity')::INTEGER;
    v_materials := v_recipe->'materials';

    -- Получаем информацию о рецепте
    SELECT result_item_id, result_quantity
    INTO v_result_item_id, v_result_quantity
    FROM crafting_recipes
    WHERE id = v_recipe_id AND is_active = true;

    IF v_result_item_id IS NULL THEN
      RAISE EXCEPTION 'Recipe not found: %', v_recipe_id;
    END IF;

    -- Удаляем материалы из инвентаря
    FOR v_material IN SELECT * FROM jsonb_array_elements(v_materials)
    LOOP
      DELETE FROM item_instances
      WHERE wallet_address = p_wallet_address
        AND template_id = (v_material->>'template_id')::INTEGER
        AND id IN (
          SELECT id FROM item_instances
          WHERE wallet_address = p_wallet_address
            AND template_id = (v_material->>'template_id')::INTEGER
          LIMIT (v_material->>'quantity')::INTEGER * v_quantity
        );
    END LOOP;

    -- Создаем результирующие предметы
    INSERT INTO item_instances (wallet_address, template_id, item_id, name, type)
    SELECT 
      p_wallet_address,
      it.id,
      it.item_id,
      it.name,
      it.type
    FROM item_templates it
    CROSS JOIN generate_series(1, v_result_quantity * v_quantity)
    WHERE it.id = v_result_item_id;

    v_total_crafted := v_total_crafted + (v_result_quantity * v_quantity);
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'total_crafted', v_total_crafted,
    'recipes_processed', jsonb_array_length(p_recipes)
  );
END;
$$;

-- RPC для batch обновления характеристик карт
CREATE OR REPLACE FUNCTION public.batch_update_card_stats(
  p_wallet_address TEXT,
  p_card_updates JSONB -- массив: [{card_instance_id, current_health, current_defense, monster_kills}]
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_card_update JSONB;
  v_updated_count INTEGER := 0;
BEGIN
  -- Обрабатываем каждое обновление карты
  FOR v_card_update IN SELECT * FROM jsonb_array_elements(p_card_updates)
  LOOP
    UPDATE card_instances
    SET 
      current_health = COALESCE((v_card_update->>'current_health')::INTEGER, current_health),
      current_defense = COALESCE((v_card_update->>'current_defense')::INTEGER, current_defense),
      monster_kills = COALESCE((v_card_update->>'monster_kills')::INTEGER, monster_kills),
      updated_at = NOW()
    WHERE wallet_address = p_wallet_address
      AND id = v_card_update->>'card_instance_id';
    
    IF FOUND THEN
      v_updated_count := v_updated_count + 1;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'cards_updated', v_updated_count
  );
END;
$$;

-- Индексы для оптимизации batch операций
CREATE INDEX IF NOT EXISTS idx_item_instances_wallet_template 
ON item_instances(wallet_address, template_id) 
WHERE wallet_address IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_card_instances_wallet_template
ON card_instances(wallet_address, card_template_id)
WHERE wallet_address IS NOT NULL;