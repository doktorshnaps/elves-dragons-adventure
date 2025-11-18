-- Синхронизация карт из game_data.cards в card_instances для игрока superalexzis-hot1.tg
-- Эта миграция исправляет проблему отображения карт в инвентаре

DO $$
DECLARE
  v_game_data RECORD;
  v_card_json jsonb;
  v_card_type text;
  v_max_health integer;
  v_current_health integer;
BEGIN
  -- Получаем данные игрока
  SELECT * INTO v_game_data 
  FROM public.game_data 
  WHERE wallet_address = 'superalexzis-hot1.tg'
  LIMIT 1;

  IF v_game_data IS NOT NULL THEN
    -- Проходим по всем картам в game_data.cards
    FOR v_card_json IN SELECT * FROM jsonb_array_elements(COALESCE(v_game_data.cards, '[]'::jsonb))
    LOOP
      -- Определяем тип карты
      v_card_type := CASE 
        WHEN v_card_json->>'type' = 'pet' THEN 'dragon'
        WHEN v_card_json->>'type' IN ('worker','workers') THEN 'workers'
        ELSE 'hero' 
      END;

      -- Определяем здоровье
      v_max_health := COALESCE((v_card_json->>'health')::integer, 100);
      v_current_health := COALESCE((v_card_json->>'currentHealth')::integer, v_max_health);
      v_current_health := LEAST(v_current_health, v_max_health);

      -- Создаем или обновляем запись в card_instances
      INSERT INTO public.card_instances (
        wallet_address,
        user_id,
        card_template_id,
        card_type,
        current_health,
        max_health,
        last_heal_time,
        card_data
      ) VALUES (
        'superalexzis-hot1.tg',
        v_game_data.user_id,
        v_card_json->>'id',
        v_card_type,
        v_current_health,
        v_max_health,
        now(),
        v_card_json
      )
      ON CONFLICT (wallet_address, card_template_id)
      DO UPDATE SET 
        max_health = EXCLUDED.max_health,
        current_health = LEAST(card_instances.current_health, EXCLUDED.max_health),
        last_heal_time = COALESCE(card_instances.last_heal_time, EXCLUDED.last_heal_time),
        card_data = EXCLUDED.card_data,
        updated_at = now();
    END LOOP;

    RAISE NOTICE 'Синхронизация карт завершена для игрока superalexzis-hot1.tg';
  ELSE
    RAISE NOTICE 'Игрок superalexzis-hot1.tg не найден в game_data';
  END IF;
END $$;