-- Обновляем migrate_cards_to_instances для правильного расчета характеристик с учетом мультипликаторов

DROP FUNCTION IF EXISTS public.migrate_cards_to_instances(TEXT);

CREATE FUNCTION public.migrate_cards_to_instances(p_wallet_address TEXT)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  cards_json jsonb;
  card_obj jsonb;
  card_rec record;
  v_card_type text;
  v_card_id text;
  v_mapped_type text;
  v_card_name text;
  v_card_class text;
  v_rarity integer;
  v_inserted integer := 0;
  v_skipped integer := 0;
  
  -- Базовые характеристики
  v_hero_base record;
  v_dragon_base record;
  v_base_health integer;
  v_base_defense integer;
  
  -- Мультипликаторы
  v_rarity_mult numeric;
  v_class_mult_health numeric;
  v_class_mult_defense numeric;
  
  -- Вычисленные характеристики
  v_max_health integer;
  v_max_defense integer;
BEGIN
  -- Загружаем базовые характеристики
  SELECT * INTO v_hero_base FROM public.hero_base_stats LIMIT 1;
  SELECT * INTO v_dragon_base FROM public.dragon_base_stats LIMIT 1;
  
  -- Получаем cards массив из game_data
  SELECT (game_data.cards)::jsonb INTO cards_json
  FROM public.game_data
  WHERE wallet_address = p_wallet_address;

  IF cards_json IS NULL OR jsonb_array_length(cards_json) = 0 THEN
    RETURN jsonb_build_object('inserted_count', 0, 'skipped_count', 0, 'message', 'No cards found in game_data');
  END IF;

  -- Перебираем все карты
  FOR card_rec IN 
    SELECT jsonb_array_elements(cards_json) AS card_json
  LOOP
    card_obj := card_rec.card_json;
    v_card_type := card_obj->>'type';
    v_card_id := card_obj->>'id';
    v_card_name := card_obj->>'name';
    v_card_class := card_obj->>'cardClass';
    v_rarity := COALESCE((card_obj->>'rarity')::integer, 1);

    -- Пропускаем рабочих
    IF v_card_type = 'workers' THEN
      v_skipped := v_skipped + 1;
      CONTINUE;
    END IF;

    -- Маппинг типов: 'character' → 'hero', 'pet' → 'dragon'
    IF v_card_type = 'character' THEN
      v_mapped_type := 'hero';
    ELSIF v_card_type = 'pet' THEN
      v_mapped_type := 'dragon';
    ELSE
      v_mapped_type := v_card_type;
    END IF;

    -- Вставляем только character и pet типы (герои и драконы)
    IF v_card_type IN ('character', 'pet', 'hero', 'dragon') THEN
      -- Определяем базовые характеристики
      IF v_card_type IN ('character', 'hero') THEN
        v_base_health := v_hero_base.health;
        v_base_defense := v_hero_base.defense;
      ELSE
        v_base_health := v_dragon_base.health;
        v_base_defense := v_dragon_base.defense;
      END IF;
      
      -- Получаем мультипликатор редкости
      SELECT multiplier INTO v_rarity_mult
      FROM public.rarity_multipliers
      WHERE rarity = v_rarity
      LIMIT 1;
      v_rarity_mult := COALESCE(v_rarity_mult, 1.0);
      
      -- Получаем мультипликаторы класса
      IF v_card_type IN ('character', 'hero') THEN
        SELECT health_multiplier, defense_multiplier 
        INTO v_class_mult_health, v_class_mult_defense
        FROM public.class_multipliers
        WHERE class_name = v_card_class
        LIMIT 1;
      ELSE
        SELECT health_multiplier, defense_multiplier 
        INTO v_class_mult_health, v_class_mult_defense
        FROM public.dragon_class_multipliers
        WHERE class_name = v_card_class
        LIMIT 1;
      END IF;
      
      v_class_mult_health := COALESCE(v_class_mult_health, 1.0);
      v_class_mult_defense := COALESCE(v_class_mult_defense, 1.0);
      
      -- Вычисляем финальные характеристики
      v_max_health := FLOOR(v_base_health * v_rarity_mult * v_class_mult_health);
      v_max_defense := FLOOR(v_base_defense * v_rarity_mult * v_class_mult_defense);
      
      INSERT INTO public.card_instances (
        wallet_address,
        card_template_id,
        card_type,
        card_data,
        max_health,
        current_health,
        max_defense,
        current_defense,
        monster_kills
      ) VALUES (
        p_wallet_address,
        v_card_id,
        v_mapped_type,
        card_obj,
        v_max_health,
        v_max_health,
        v_max_defense,
        v_max_defense,
        0
      )
      ON CONFLICT (wallet_address, card_template_id) DO NOTHING;

      IF FOUND THEN
        v_inserted := v_inserted + 1;
      ELSE
        v_skipped := v_skipped + 1;
      END IF;
    ELSE
      v_skipped := v_skipped + 1;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'inserted_count', v_inserted,
    'skipped_count', v_skipped,
    'message', format('Migrated %s cards, skipped %s', v_inserted, v_skipped)
  );
END;
$$;