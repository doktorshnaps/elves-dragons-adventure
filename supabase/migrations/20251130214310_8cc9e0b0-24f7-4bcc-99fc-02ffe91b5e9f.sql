-- Fix recalculate_all_card_instances_from_templates to skip workers
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
    WHERE card_type IN ('hero', 'dragon') -- Skip workers
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