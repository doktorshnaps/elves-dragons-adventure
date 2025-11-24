-- Функция для миграции карт из game_data.cards (JSON) в card_instances таблицу
-- Это необходимо, так как карты сохраняются в JSON, но не создаются записи в card_instances
-- что приводит к невозможности сохранения здоровья/брони после боя

CREATE OR REPLACE FUNCTION public.migrate_cards_to_instances(
  p_wallet_address TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_game_data RECORD;
  v_card JSON;
  v_card_data JSONB;
  v_existing_ids TEXT[];
  v_inserted_count INT := 0;
  v_skipped_count INT := 0;
  v_template_id TEXT;
  v_card_type TEXT;
  v_defense INT;
BEGIN
  -- Получаем game_data для игрока
  SELECT * INTO v_game_data
  FROM game_data
  WHERE wallet_address = p_wallet_address;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Game data not found for wallet: %', p_wallet_address;
  END IF;
  
  -- Получаем список уже существующих card_template_id для этого кошелька
  SELECT ARRAY_AGG(card_template_id) INTO v_existing_ids
  FROM card_instances
  WHERE wallet_address = p_wallet_address
    AND card_type IN ('character', 'pet'); -- Только герои и драконы, не workers
  
  v_existing_ids := COALESCE(v_existing_ids, ARRAY[]::TEXT[]);
  
  RAISE NOTICE 'Found % existing card instances for wallet %', ARRAY_LENGTH(v_existing_ids, 1), p_wallet_address;
  
  -- Итерируемся по всем картам в game_data.cards
  FOR v_card IN SELECT * FROM jsonb_array_elements(v_game_data.cards)
  LOOP
    v_card_data := v_card::JSONB;
    v_template_id := v_card_data->>'id';
    v_card_type := v_card_data->>'type';
    v_defense := COALESCE((v_card_data->>'defense')::INT, 0);
    
    -- Пропускаем workers и уже существующие записи
    IF v_card_type = 'workers' THEN
      CONTINUE;
    END IF;
    
    IF v_template_id = ANY(v_existing_ids) THEN
      v_skipped_count := v_skipped_count + 1;
      CONTINUE;
    END IF;
    
    -- Создаем запись в card_instances
    INSERT INTO card_instances (
      wallet_address,
      card_template_id,
      card_type,
      card_data,
      max_health,
      current_health,
      current_defense,
      max_defense,
      monster_kills
    ) VALUES (
      p_wallet_address,
      v_template_id,
      v_card_type,
      v_card_data,
      100, -- Будет пересчитано на клиенте
      100,
      v_defense,
      v_defense,
      COALESCE((v_card_data->>'monster_kills')::INT, 0)
    );
    
    v_inserted_count := v_inserted_count + 1;
  END LOOP;
  
  RAISE NOTICE 'Migration complete. Inserted: %, Skipped: %', v_inserted_count, v_skipped_count;
  
  RETURN json_build_object(
    'success', TRUE,
    'inserted_count', v_inserted_count,
    'skipped_count', v_skipped_count,
    'total_cards_in_json', jsonb_array_length(v_game_data.cards)
  );
END;
$$;