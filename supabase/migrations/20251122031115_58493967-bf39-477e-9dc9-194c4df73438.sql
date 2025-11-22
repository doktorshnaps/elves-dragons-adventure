-- Безопасный пересчет характеристик карт

DO $$
DECLARE
  card_rec RECORD;
  rarity_mult NUMERIC;
  health_mult NUMERIC := 1.0;
  defense_mult NUMERIC := 1.0;
  power_mult NUMERIC := 1.0;
  magic_mult NUMERIC := 1.0;
  calc_power INTEGER;
  calc_defense INTEGER;
  calc_health INTEGER;
  calc_magic INTEGER;
  hero_base_h INTEGER := 100;
  hero_base_d INTEGER := 10;
  hero_base_p INTEGER := 30;
  hero_base_m INTEGER := 15;
  dragon_base_h INTEGER := 390;
  dragon_base_d INTEGER := 20;
  dragon_base_p INTEGER := 56;
  dragon_base_m INTEGER := 30;
BEGIN
  -- Загрузить базовые статы
  SELECT health, defense, power, magic INTO hero_base_h, hero_base_d, hero_base_p, hero_base_m
  FROM hero_base_stats LIMIT 1;
  
  SELECT health, defense, power, magic INTO dragon_base_h, dragon_base_d, dragon_base_p, dragon_base_m
  FROM dragon_base_stats LIMIT 1;

  FOR card_rec IN 
    SELECT id, card_type, card_data,
      (card_data->>'rarity')::INTEGER as rarity,
      card_data->>'name' as name,
      current_health, current_defense
    FROM card_instances 
    WHERE card_type IN ('hero', 'dragon')
      AND card_data IS NOT NULL
      AND card_data->>'rarity' IS NOT NULL
  LOOP
    SELECT multiplier INTO rarity_mult FROM rarity_multipliers WHERE rarity = card_rec.rarity;
    IF rarity_mult IS NULL THEN CONTINUE; END IF;

    health_mult := 1.0;
    defense_mult := 1.0;
    power_mult := 1.0;
    magic_mult := 1.0;
    
    IF card_rec.card_type = 'hero' THEN
      SELECT health_multiplier, defense_multiplier, power_multiplier, magic_multiplier
      INTO health_mult, defense_mult, power_mult, magic_mult
      FROM class_multipliers
      WHERE LOWER(class_name) = LOWER(card_rec.name)
         OR LOWER(card_rec.name) LIKE '%' || LOWER(REPLACE(class_name, ' ', '')) || '%'
         OR LOWER(REPLACE(class_name, ' ', '')) LIKE '%' || LOWER(card_rec.name) || '%'
      ORDER BY LENGTH(class_name) DESC LIMIT 1;
      
      calc_power := FLOOR(hero_base_p * rarity_mult * power_mult);
      calc_defense := FLOOR(hero_base_d * rarity_mult * defense_mult);
      calc_health := FLOOR(hero_base_h * rarity_mult * health_mult);
      calc_magic := FLOOR(hero_base_m * rarity_mult * magic_mult);
    ELSE
      SELECT health_multiplier, defense_multiplier, power_multiplier, magic_multiplier
      INTO health_mult, defense_mult, power_mult, magic_mult
      FROM dragon_class_multipliers
      WHERE LOWER(class_name) = LOWER(card_rec.name)
         OR LOWER(card_rec.name) LIKE '%' || LOWER(REPLACE(class_name, ' ', '')) || '%'
         OR LOWER(REPLACE(class_name, ' ', '')) LIKE '%' || LOWER(card_rec.name) || '%'
      ORDER BY LENGTH(class_name) DESC LIMIT 1;
      
      calc_power := FLOOR(dragon_base_p * rarity_mult * power_mult);
      calc_defense := FLOOR(dragon_base_d * rarity_mult * defense_mult);
      calc_health := FLOOR(dragon_base_h * rarity_mult * health_mult);
      calc_magic := FLOOR(dragon_base_m * rarity_mult * magic_mult);
    END IF;

    IF calc_health IS NULL OR calc_power IS NULL OR calc_defense IS NULL OR calc_magic IS NULL THEN
      CONTINUE;
    END IF;

    UPDATE card_instances
    SET 
      card_data = jsonb_set(
        jsonb_set(
          jsonb_set(
            jsonb_set(card_data::jsonb, '{power}', to_jsonb(calc_power)),
            '{defense}', to_jsonb(calc_defense)
          ),
          '{health}', to_jsonb(calc_health)
        ),
        '{magic}', to_jsonb(calc_magic)
      ),
      max_health = calc_health,
      max_defense = calc_defense,
      current_health = LEAST(COALESCE(current_health, calc_health), calc_health),
      current_defense = LEAST(COALESCE(current_defense, calc_defense), calc_defense),
      updated_at = now()
    WHERE id = card_rec.id;
  END LOOP;
  
  RAISE NOTICE 'Card stats updated';
END $$;