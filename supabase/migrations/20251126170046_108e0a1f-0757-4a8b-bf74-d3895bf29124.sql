
-- Fix incorrect card stats by recalculating with proper multipliers
-- This affects cards that were created without proper stat calculation

DO $$
DECLARE
  card_record RECORD;
  base_health INTEGER;
  base_defense INTEGER;
  base_power INTEGER;
  base_magic INTEGER;
  rarity_mult NUMERIC;
  class_health_mult NUMERIC;
  class_defense_mult NUMERIC;
  class_power_mult NUMERIC;
  class_magic_mult NUMERIC;
  final_health INTEGER;
  final_defense INTEGER;
  final_power INTEGER;
  final_magic INTEGER;
  card_class TEXT;
BEGIN
  -- Loop through all hero and dragon cards
  FOR card_record IN 
    SELECT id, card_data, card_type
    FROM card_instances
    WHERE card_type IN ('hero', 'dragon')
  LOOP
    -- Get base stats based on card type
    IF card_record.card_type = 'hero' THEN
      SELECT health, defense, power, magic 
      INTO base_health, base_defense, base_power, base_magic
      FROM hero_base_stats LIMIT 1;
    ELSE
      SELECT health, defense, power, magic 
      INTO base_health, base_defense, base_power, base_magic
      FROM dragon_base_stats LIMIT 1;
    END IF;

    -- Get rarity multiplier
    SELECT multiplier INTO rarity_mult
    FROM rarity_multipliers
    WHERE rarity = CAST(card_record.card_data->>'rarity' AS INTEGER);

    -- Get class name from card_class_mappings
    SELECT class_name INTO card_class
    FROM card_class_mappings
    WHERE card_name = card_record.card_data->>'name'
      AND card_type = card_record.card_type
    LIMIT 1;

    -- Get class multipliers based on card type
    IF card_record.card_type = 'hero' THEN
      SELECT health_multiplier, defense_multiplier, power_multiplier, magic_multiplier
      INTO class_health_mult, class_defense_mult, class_power_mult, class_magic_mult
      FROM class_multipliers
      WHERE class_name = card_class;
    ELSE
      SELECT health_multiplier, defense_multiplier, power_multiplier, magic_multiplier
      INTO class_health_mult, class_defense_mult, class_power_mult, class_magic_mult
      FROM dragon_class_multipliers
      WHERE class_name = card_class;
    END IF;

    -- Calculate final stats
    final_health := ROUND(base_health * rarity_mult * COALESCE(class_health_mult, 1.0));
    final_defense := ROUND(base_defense * rarity_mult * COALESCE(class_defense_mult, 1.0));
    final_power := ROUND(base_power * rarity_mult * COALESCE(class_power_mult, 1.0));
    final_magic := ROUND(base_magic * rarity_mult * COALESCE(class_magic_mult, 1.0));

    -- Update card_instances only if stats are incorrect
    UPDATE card_instances
    SET 
      max_health = final_health,
      max_defense = final_defense,
      max_power = final_power,
      max_magic = final_magic,
      -- Restore current health/defense to max if they were at max before
      current_health = CASE 
        WHEN current_health >= max_health THEN final_health 
        ELSE current_health 
      END,
      current_defense = CASE 
        WHEN current_defense >= max_defense THEN final_defense 
        ELSE current_defense 
      END,
      -- Update card_data JSON with correct stats
      card_data = jsonb_set(
        jsonb_set(
          jsonb_set(
            jsonb_set(
              card_data,
              '{health}', to_jsonb(final_health)
            ),
            '{defense}', to_jsonb(final_defense)
          ),
          '{power}', to_jsonb(final_power)
        ),
        '{magic}', to_jsonb(final_magic)
      ),
      updated_at = NOW()
    WHERE id = card_record.id
      AND (max_health != final_health 
        OR max_defense != final_defense 
        OR max_power != final_power 
        OR max_magic != final_magic);

  END LOOP;
END $$;
