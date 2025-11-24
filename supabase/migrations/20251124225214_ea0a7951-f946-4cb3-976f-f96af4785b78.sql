-- Исправляем search_path для функции migrate_cards_to_instances

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
  v_inserted integer := 0;
  v_skipped integer := 0;
BEGIN
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

    -- Пропускаем рабочих (workers), они уже в card_instances
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
        100,
        100,
        COALESCE((card_obj->>'defense')::integer, 0),
        COALESCE((card_obj->>'defense')::integer, 0),
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