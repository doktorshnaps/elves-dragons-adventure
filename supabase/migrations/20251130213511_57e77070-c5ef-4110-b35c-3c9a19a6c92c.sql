-- Fix migrate_cards_to_instances to use card_templates instead of manual calculation
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
  v_card_faction text;
  v_rarity integer;
  v_inserted integer := 0;
  v_skipped integer := 0;
  
  -- Stats from card_templates
  v_template record;
BEGIN
  -- Get cards array from game_data
  SELECT (game_data.cards)::jsonb INTO cards_json
  FROM public.game_data
  WHERE wallet_address = p_wallet_address;

  IF cards_json IS NULL OR jsonb_array_length(cards_json) = 0 THEN
    RETURN jsonb_build_object('inserted_count', 0, 'skipped_count', 0, 'message', 'No cards found in game_data');
  END IF;

  -- Iterate through all cards
  FOR card_rec IN 
    SELECT jsonb_array_elements(cards_json) AS card_json
  LOOP
    card_obj := card_rec.card_json;
    v_card_type := card_obj->>'type';
    v_card_id := card_obj->>'id';
    v_card_name := card_obj->>'name';
    v_card_faction := card_obj->>'faction';
    v_rarity := COALESCE((card_obj->>'rarity')::integer, 1);

    -- Skip workers
    IF v_card_type = 'workers' THEN
      v_skipped := v_skipped + 1;
      CONTINUE;
    END IF;

    -- Map types: 'character' → 'hero', 'pet' → 'dragon'
    IF v_card_type = 'character' THEN
      v_mapped_type := 'hero';
    ELSIF v_card_type = 'pet' THEN
      v_mapped_type := 'dragon';
    ELSE
      v_mapped_type := v_card_type;
    END IF;

    -- Insert only character and pet types (heroes and dragons)
    IF v_card_type IN ('character', 'pet', 'hero', 'dragon') THEN
      -- Get stats from card_templates
      SELECT power, defense, health, magic
      INTO v_template
      FROM public.card_templates
      WHERE card_name = v_card_name
        AND card_type = v_mapped_type
        AND rarity = v_rarity
        AND (faction = v_card_faction OR (faction IS NULL AND v_card_faction IS NULL))
      LIMIT 1;
      
      -- If template not found, skip this card
      IF NOT FOUND THEN
        v_skipped := v_skipped + 1;
        CONTINUE;
      END IF;
      
      INSERT INTO public.card_instances (
        wallet_address,
        card_template_id,
        card_type,
        card_data,
        max_health,
        current_health,
        max_defense,
        current_defense,
        max_power,
        max_magic,
        monster_kills
      ) VALUES (
        p_wallet_address,
        v_card_id,
        v_mapped_type,
        card_obj,
        v_template.health,
        v_template.health,
        v_template.defense,
        v_template.defense,
        v_template.power,
        v_template.magic,
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

-- Fix recalculate_all_card_instances_from_templates to include faction
DROP FUNCTION IF EXISTS public.recalculate_all_card_instances_from_templates();

CREATE OR REPLACE FUNCTION public.recalculate_all_card_instances_from_templates()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_instance record;
  v_template record;
  v_count integer := 0;
  v_card_data jsonb;
  v_card_name text;
  v_card_type text;
  v_card_faction text;
  v_rarity integer;
BEGIN
  FOR v_instance IN
    SELECT id, card_data, card_type
    FROM public.card_instances
  LOOP
    v_card_data := v_instance.card_data;
    v_card_name := v_card_data->>'name';
    v_card_faction := v_card_data->>'faction';
    v_rarity := (v_card_data->>'rarity')::integer;
    v_card_type := v_instance.card_type;

    -- Get stats from template including faction
    SELECT power, defense, health, magic
    INTO v_template
    FROM public.card_templates
    WHERE card_name = v_card_name
      AND card_type = v_card_type
      AND rarity = v_rarity
      AND (faction = v_card_faction OR (faction IS NULL AND v_card_faction IS NULL));

    IF FOUND AND v_template.power > 0 THEN
      -- Update card instance with template stats
      UPDATE public.card_instances
      SET
        max_power = v_template.power,
        max_defense = v_template.defense,
        max_health = v_template.health,
        max_magic = v_template.magic,
        current_health = LEAST(current_health, v_template.health),
        current_defense = LEAST(current_defense, v_template.defense),
        card_data = jsonb_set(
          jsonb_set(
            jsonb_set(
              jsonb_set(
                v_card_data,
                '{power}', to_jsonb(v_template.power)
              ),
              '{defense}', to_jsonb(v_template.defense)
            ),
            '{health}', to_jsonb(v_template.health)
          ),
          '{magic}', to_jsonb(v_template.magic)
        ),
        updated_at = now()
      WHERE id = v_instance.id;

      v_count := v_count + 1;
    END IF;
  END LOOP;

  RETURN v_count;
END;
$$;