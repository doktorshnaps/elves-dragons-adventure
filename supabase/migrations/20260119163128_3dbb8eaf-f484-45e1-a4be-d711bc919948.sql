-- RPC для начала улучшения героя
-- Удаляет 2 карточки, списывает ресурсы, добавляет в barracksUpgrades
CREATE OR REPLACE FUNCTION public.start_hero_upgrade(
  p_wallet_address TEXT,
  p_card_instance_id_1 UUID,
  p_card_instance_id_2 UUID,
  p_upgrade_id TEXT,
  p_from_rarity INT,
  p_to_rarity INT,
  p_end_time BIGINT,
  p_base_card JSONB,
  p_cost_ell INT DEFAULT 0,
  p_cost_wood INT DEFAULT 0,
  p_cost_stone INT DEFAULT 0,
  p_cost_iron INT DEFAULT 0,
  p_cost_gold INT DEFAULT 0,
  p_item_instance_ids TEXT[] DEFAULT '{}'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_game_data_record RECORD;
  v_current_upgrades JSONB;
  v_new_upgrade JSONB;
  v_deleted_count INT := 0;
  v_item_id TEXT;
BEGIN
  -- 1. Проверяем, что обе карточки существуют и принадлежат пользователю
  IF NOT EXISTS (SELECT 1 FROM card_instances WHERE id = p_card_instance_id_1 AND wallet_address = p_wallet_address) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Первая карточка не найдена');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM card_instances WHERE id = p_card_instance_id_2 AND wallet_address = p_wallet_address) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Вторая карточка не найдена');
  END IF;

  -- 2. Получаем текущие данные игрока
  SELECT * INTO v_game_data_record FROM game_data WHERE wallet_address = p_wallet_address;
  
  IF v_game_data_record IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Игровые данные не найдены');
  END IF;

  -- 3. Проверяем достаточность ресурсов
  IF p_cost_ell > 0 AND v_game_data_record.balance < p_cost_ell THEN
    RETURN jsonb_build_object('success', false, 'error', 'Недостаточно ELL');
  END IF;
  IF p_cost_wood > 0 AND v_game_data_record.wood < p_cost_wood THEN
    RETURN jsonb_build_object('success', false, 'error', 'Недостаточно дерева');
  END IF;
  IF p_cost_stone > 0 AND v_game_data_record.stone < p_cost_stone THEN
    RETURN jsonb_build_object('success', false, 'error', 'Недостаточно камня');
  END IF;
  IF p_cost_iron > 0 AND v_game_data_record.iron < p_cost_iron THEN
    RETURN jsonb_build_object('success', false, 'error', 'Недостаточно железа');
  END IF;
  IF p_cost_gold > 0 AND v_game_data_record.gold < p_cost_gold THEN
    RETURN jsonb_build_object('success', false, 'error', 'Недостаточно золота');
  END IF;

  -- 4. Удаляем 2 карточки
  DELETE FROM card_instances WHERE id = p_card_instance_id_1 AND wallet_address = p_wallet_address;
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  IF v_deleted_count = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Не удалось удалить первую карточку');
  END IF;

  DELETE FROM card_instances WHERE id = p_card_instance_id_2 AND wallet_address = p_wallet_address;
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  IF v_deleted_count = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Не удалось удалить вторую карточку');
  END IF;

  -- 5. Удаляем требуемые предметы
  FOREACH v_item_id IN ARRAY p_item_instance_ids
  LOOP
    DELETE FROM item_instances WHERE id = v_item_id::uuid AND wallet_address = p_wallet_address;
  END LOOP;

  -- 6. Списываем ресурсы
  UPDATE game_data
  SET 
    balance = balance - p_cost_ell,
    wood = wood - p_cost_wood,
    stone = stone - p_cost_stone,
    iron = iron - p_cost_iron,
    gold = gold - p_cost_gold,
    updated_at = now()
  WHERE wallet_address = p_wallet_address;

  -- 7. Добавляем улучшение в barracksUpgrades
  v_current_upgrades := COALESCE(v_game_data_record.barracks_upgrades, '[]'::jsonb);
  
  v_new_upgrade := jsonb_build_object(
    'id', p_upgrade_id,
    'heroId', p_card_instance_id_1::text,
    'startTime', (extract(epoch from now()) * 1000)::bigint,
    'endTime', p_end_time,
    'fromRarity', p_from_rarity,
    'toRarity', p_to_rarity,
    'baseCard', p_base_card
  );

  UPDATE game_data
  SET 
    barracks_upgrades = v_current_upgrades || v_new_upgrade,
    updated_at = now()
  WHERE wallet_address = p_wallet_address;

  RETURN jsonb_build_object(
    'success', true,
    'upgrade_id', p_upgrade_id,
    'end_time', p_end_time
  );
END;
$$;

-- RPC для завершения улучшения героя
-- Создает новую улучшенную карточку и удаляет запись из barracksUpgrades
CREATE OR REPLACE FUNCTION public.claim_hero_upgrade(
  p_wallet_address TEXT,
  p_upgrade_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_game_data_record RECORD;
  v_current_upgrades JSONB;
  v_upgrade JSONB;
  v_upgrade_index INT := -1;
  v_base_card JSONB;
  v_new_card_id UUID;
  v_from_rarity INT;
  v_to_rarity INT;
  v_card_name TEXT;
  v_card_type TEXT;
  v_faction TEXT;
  v_card_class TEXT;
  v_base_power INT;
  v_base_defense INT;
  v_base_health INT;
  v_base_magic INT;
  v_new_power INT;
  v_new_defense INT;
  v_new_health INT;
  v_new_magic INT;
  v_rarity_multiplier NUMERIC := 1.0;
  v_idx INT := 0;
  v_card_data JSONB;
BEGIN
  -- 1. Получаем данные игрока
  SELECT * INTO v_game_data_record FROM game_data WHERE wallet_address = p_wallet_address;
  
  IF v_game_data_record IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Игровые данные не найдены');
  END IF;

  v_current_upgrades := COALESCE(v_game_data_record.barracks_upgrades, '[]'::jsonb);

  -- 2. Находим улучшение по ID
  FOR v_idx IN 0..jsonb_array_length(v_current_upgrades) - 1 LOOP
    IF v_current_upgrades->v_idx->>'id' = p_upgrade_id THEN
      v_upgrade := v_current_upgrades->v_idx;
      v_upgrade_index := v_idx;
      EXIT;
    END IF;
  END LOOP;

  IF v_upgrade IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Улучшение не найдено');
  END IF;

  -- 3. Проверяем, что таймер завершен
  IF (v_upgrade->>'endTime')::bigint > (extract(epoch from now()) * 1000)::bigint THEN
    RETURN jsonb_build_object('success', false, 'error', 'Улучшение еще не завершено');
  END IF;

  -- 4. Извлекаем данные базовой карты
  v_base_card := v_upgrade->'baseCard';
  v_from_rarity := (v_upgrade->>'fromRarity')::int;
  v_to_rarity := (v_upgrade->>'toRarity')::int;
  v_card_name := v_base_card->>'name';
  v_card_type := COALESCE(v_base_card->>'type', 'character');
  v_faction := v_base_card->>'faction';
  v_card_class := v_base_card->>'cardClass';
  v_base_power := COALESCE((v_base_card->>'power')::int, 100);
  v_base_defense := COALESCE((v_base_card->>'defense')::int, 100);
  v_base_health := COALESCE((v_base_card->>'health')::int, 100);
  v_base_magic := COALESCE((v_base_card->>'magic')::int, 100);

  -- 5. Получаем множитель редкости для нового ранга
  SELECT multiplier INTO v_rarity_multiplier 
  FROM rarity_multipliers 
  WHERE rarity = v_to_rarity;
  
  IF v_rarity_multiplier IS NULL THEN
    v_rarity_multiplier := 1.0 + (v_to_rarity - v_from_rarity) * 0.8;
  END IF;

  -- 6. Рассчитываем новые статы (увеличение на 1.8x за каждый ранг)
  v_new_power := FLOOR(v_base_power * POWER(1.8, v_to_rarity - v_from_rarity));
  v_new_defense := FLOOR(v_base_defense * POWER(1.8, v_to_rarity - v_from_rarity));
  v_new_health := FLOOR(v_base_health * POWER(1.8, v_to_rarity - v_from_rarity));
  v_new_magic := FLOOR(v_base_magic * POWER(1.8, v_to_rarity - v_from_rarity));

  -- 7. Создаем новую карточку
  v_new_card_id := gen_random_uuid();
  
  v_card_data := jsonb_build_object(
    'id', v_base_card->>'id',
    'name', v_card_name,
    'type', v_card_type,
    'rarity', v_to_rarity,
    'power', v_new_power,
    'defense', v_new_defense,
    'health', v_new_health,
    'magic', v_new_magic,
    'faction', v_faction,
    'cardClass', v_card_class,
    'image', v_base_card->>'image',
    'description', v_base_card->>'description'
  );

  INSERT INTO card_instances (
    id,
    wallet_address,
    card_template_id,
    card_type,
    card_data,
    max_power,
    max_defense,
    max_health,
    max_magic,
    current_health,
    current_defense,
    monster_kills,
    created_at,
    updated_at
  ) VALUES (
    v_new_card_id,
    p_wallet_address,
    v_base_card->>'id',
    'hero',
    v_card_data,
    v_new_power,
    v_new_defense,
    v_new_health,
    v_new_magic,
    v_new_health,
    v_new_defense,
    0,
    now(),
    now()
  );

  -- 8. Удаляем улучшение из barracksUpgrades
  v_current_upgrades := v_current_upgrades - v_upgrade_index;

  UPDATE game_data
  SET 
    barracks_upgrades = v_current_upgrades,
    updated_at = now()
  WHERE wallet_address = p_wallet_address;

  RETURN jsonb_build_object(
    'success', true,
    'new_card_id', v_new_card_id::text,
    'card_name', v_card_name,
    'new_rarity', v_to_rarity
  );
END;
$$;