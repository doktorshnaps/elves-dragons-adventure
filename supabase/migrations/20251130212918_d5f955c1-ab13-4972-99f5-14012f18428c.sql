-- Drop existing unique constraint and add new one including faction
ALTER TABLE public.card_templates
DROP CONSTRAINT IF EXISTS card_templates_card_name_card_type_rarity_key;

ALTER TABLE public.card_templates
ADD CONSTRAINT card_templates_card_name_card_type_rarity_faction_key 
UNIQUE (card_name, card_type, rarity, faction);

-- Recreate populate_card_templates function with updated ON CONFLICT
DROP FUNCTION IF EXISTS public.populate_card_templates();

CREATE OR REPLACE FUNCTION public.populate_card_templates()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_image_record RECORD;
  v_base_power integer;
  v_base_defense integer;
  v_base_health integer;
  v_base_magic integer;
  v_rarity_mult numeric;
  v_class_mult_power numeric := 1.0;
  v_class_mult_defense numeric := 1.0;
  v_class_mult_health numeric := 1.0;
  v_class_mult_magic numeric := 1.0;
  v_class_name text;
  v_final_power integer;
  v_final_defense integer;
  v_final_health integer;
  v_final_magic integer;
  v_count integer := 0;
BEGIN
  -- Iterate through all unique cards in card_images
  FOR v_image_record IN 
    SELECT DISTINCT card_name, card_type, rarity, faction
    FROM public.card_images
    ORDER BY card_name, rarity
  LOOP
    -- Get base stats depending on card type
    IF v_image_record.card_type = 'hero' THEN
      SELECT power, defense, health, magic
      INTO v_base_power, v_base_defense, v_base_health, v_base_magic
      FROM public.hero_base_stats
      LIMIT 1;
    ELSIF v_image_record.card_type = 'dragon' THEN
      SELECT power, defense, health, magic
      INTO v_base_power, v_base_defense, v_base_health, v_base_magic
      FROM public.dragon_base_stats
      LIMIT 1;
    ELSE
      CONTINUE;
    END IF;

    -- Get rarity multiplier
    SELECT multiplier INTO v_rarity_mult
    FROM public.rarity_multipliers
    WHERE rarity = v_image_record.rarity;

    IF v_rarity_mult IS NULL THEN
      v_rarity_mult := 1.0;
    END IF;

    -- Get class name from card_class_mappings
    SELECT class_name INTO v_class_name
    FROM public.card_class_mappings
    WHERE card_name = v_image_record.card_name
      AND card_type = v_image_record.card_type
    LIMIT 1;

    -- Get class multipliers
    IF v_class_name IS NOT NULL THEN
      IF v_image_record.card_type = 'hero' THEN
        SELECT 
          power_multiplier, defense_multiplier, 
          health_multiplier, magic_multiplier
        INTO 
          v_class_mult_power, v_class_mult_defense,
          v_class_mult_health, v_class_mult_magic
        FROM public.class_multipliers
        WHERE class_name = v_class_name;
      ELSIF v_image_record.card_type = 'dragon' THEN
        SELECT 
          power_multiplier, defense_multiplier,
          health_multiplier, magic_multiplier
        INTO 
          v_class_mult_power, v_class_mult_defense,
          v_class_mult_health, v_class_mult_magic
        FROM public.dragon_class_multipliers
        WHERE class_name = v_class_name;
      END IF;
    END IF;

    -- Set defaults if multipliers not found
    v_class_mult_power := COALESCE(v_class_mult_power, 1.0);
    v_class_mult_defense := COALESCE(v_class_mult_defense, 1.0);
    v_class_mult_health := COALESCE(v_class_mult_health, 1.0);
    v_class_mult_magic := COALESCE(v_class_mult_magic, 1.0);

    -- Calculate final stats
    v_final_power := ROUND(v_base_power * v_rarity_mult * v_class_mult_power);
    v_final_defense := ROUND(v_base_defense * v_rarity_mult * v_class_mult_defense);
    v_final_health := ROUND(v_base_health * v_rarity_mult * v_class_mult_health);
    v_final_magic := ROUND(v_base_magic * v_rarity_mult * v_class_mult_magic);

    -- Insert or update card template (now including faction in ON CONFLICT)
    INSERT INTO public.card_templates (
      card_name, card_type, rarity, faction,
      power, defense, health, magic
    )
    VALUES (
      v_image_record.card_name,
      v_image_record.card_type,
      v_image_record.rarity,
      v_image_record.faction,
      v_final_power,
      v_final_defense,
      v_final_health,
      v_final_magic
    )
    ON CONFLICT (card_name, card_type, rarity, faction)
    DO UPDATE SET
      power = EXCLUDED.power,
      defense = EXCLUDED.defense,
      health = EXCLUDED.health,
      magic = EXCLUDED.magic,
      updated_at = now();

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;

-- Clear existing templates and repopulate with all 126 cards
TRUNCATE TABLE public.card_templates;
SELECT public.populate_card_templates();