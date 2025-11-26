
-- Create complete class mappings for all heroes and dragons

-- Insert hero class mappings (card name = class name for heroes)
INSERT INTO card_class_mappings (card_name, card_type, class_name, created_by_wallet_address)
VALUES
  ('Рекрут', 'hero', 'Рекрут', 'mr_bruts.tg'),
  ('Страж', 'hero', 'Страж', 'mr_bruts.tg'),
  ('Ветеран', 'hero', 'Ветеран', 'mr_bruts.tg'),
  ('Защитник', 'hero', 'Защитник', 'mr_bruts.tg'),
  ('Ветеран Защитник', 'hero', 'Ветеран Защитник', 'mr_bruts.tg'),
  ('Чародей', 'hero', 'Чародей', 'mr_bruts.tg')
ON CONFLICT DO NOTHING;

-- Insert dragon class mappings based on rarity prefix
INSERT INTO card_class_mappings (card_name, card_type, class_name, created_by_wallet_address)
SELECT DISTINCT
  card_data->>'name' as card_name,
  'dragon' as card_type,
  CASE 
    WHEN card_data->>'name' LIKE 'Обычный%' THEN 'Ординарный'
    WHEN card_data->>'name' LIKE 'Необычный%' THEN 'Необычный'
    WHEN card_data->>'name' LIKE 'Редкий%' THEN 'Редкий'
    WHEN card_data->>'name' LIKE 'Эпический%' THEN 'Эпический'
    WHEN card_data->>'name' LIKE 'Легендарный%' THEN 'Легендарный'
    WHEN card_data->>'name' LIKE 'Мифический%' THEN 'Мифический'
    WHEN card_data->>'name' LIKE 'Этернал%' THEN 'Этернал'
    WHEN card_data->>'name' LIKE 'Империал%' THEN 'Империал'
    WHEN card_data->>'name' LIKE 'Титан%' THEN 'Титан'
    ELSE 'Ординарный'
  END as class_name,
  'mr_bruts.tg' as created_by_wallet_address
FROM card_instances
WHERE card_type = 'dragon'
ON CONFLICT DO NOTHING;

-- Recalculate stats for all cards with newly added class mappings
DO $$
DECLARE
  card_record RECORD;
  base_health INTEGER;
  base_defense INTEGER;
  base_power INTEGER;
  base_magic INTEGER;
  rarity_mult NUMERIC;
  class_mult NUMERIC;
  final_health INTEGER;
  final_defense INTEGER;
  final_power INTEGER;
  final_magic INTEGER;
  card_class TEXT;
BEGIN
  FOR card_record IN 
    SELECT 
      ci.id, 
      ci.card_data, 
      ci.card_type,
      ci.max_health as old_health,
      ci.max_defense as old_defense,
      ci.current_health,
      ci.current_defense
    FROM card_instances ci
    WHERE ci.card_type IN ('hero', 'dragon')
  LOOP
    -- Get base stats
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
    
    rarity_mult := COALESCE(rarity_mult, 1.0);

    -- Get class name
    SELECT class_name INTO card_class
    FROM card_class_mappings
    WHERE card_name = card_record.card_data->>'name'
      AND card_type = card_record.card_type
    LIMIT 1;

    -- Get class multiplier
    class_mult := 1.0;
    IF card_class IS NOT NULL THEN
      IF card_record.card_type = 'hero' THEN
        SELECT health_multiplier INTO class_mult
        FROM class_multipliers
        WHERE class_name = card_class;
      ELSE
        SELECT health_multiplier INTO class_mult
        FROM dragon_class_multipliers
        WHERE class_name = card_class;
      END IF;
      
      class_mult := COALESCE(class_mult, 1.0);
    END IF;

    -- Calculate final stats
    final_health := ROUND(base_health * rarity_mult * class_mult);
    final_defense := ROUND(base_defense * rarity_mult * class_mult);
    final_power := ROUND(base_power * rarity_mult * class_mult);
    final_magic := ROUND(base_magic * rarity_mult * class_mult);

    -- Update card_instances
    UPDATE card_instances
    SET 
      max_health = final_health,
      max_defense = final_defense,
      max_power = final_power,
      max_magic = final_magic,
      current_health = CASE 
        WHEN card_record.old_health > 0 AND card_record.current_health = card_record.old_health THEN final_health
        WHEN card_record.old_health > 0 THEN GREATEST(1, ROUND(card_record.current_health::NUMERIC / card_record.old_health * final_health))
        ELSE final_health
      END,
      current_defense = CASE 
        WHEN card_record.old_defense > 0 AND card_record.current_defense = card_record.old_defense THEN final_defense
        WHEN card_record.old_defense > 0 THEN GREATEST(0, ROUND(card_record.current_defense::NUMERIC / card_record.old_defense * final_defense))
        ELSE final_defense
      END,
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
    WHERE id = card_record.id;

  END LOOP;
END $$;
