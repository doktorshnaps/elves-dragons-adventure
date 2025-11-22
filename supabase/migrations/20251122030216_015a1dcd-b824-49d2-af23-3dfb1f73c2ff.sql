-- Пересчитать и сохранить ВСЕ характеристики (power, defense, health, magic) в card_data
DO $$
DECLARE
  hero_base_health INTEGER;
  hero_base_defense INTEGER;
  hero_base_power INTEGER;
  hero_base_magic INTEGER;
  dragon_base_health INTEGER;
  dragon_base_defense INTEGER;
  dragon_base_power INTEGER;
  dragon_base_magic INTEGER;
  card_record RECORD;
  rarity_mult NUMERIC;
  health_mult NUMERIC;
  defense_mult NUMERIC;
  power_mult NUMERIC;
  magic_mult NUMERIC;
  calculated_power INTEGER;
  calculated_defense INTEGER;
  calculated_health INTEGER;
  calculated_magic INTEGER;
BEGIN
  -- Получить базовые статы героев
  SELECT health, defense, power, magic 
  INTO hero_base_health, hero_base_defense, hero_base_power, hero_base_magic
  FROM hero_base_stats LIMIT 1;
  
  -- Получить базовые статы драконов
  SELECT health, defense, power, magic
  INTO dragon_base_health, dragon_base_defense, dragon_base_power, dragon_base_magic
  FROM dragon_base_stats LIMIT 1;
  
  -- Установить значения по умолчанию если таблицы пусты
  IF hero_base_health IS NULL THEN
    hero_base_health := 100;
    hero_base_defense := 25;
    hero_base_power := 20;
    hero_base_magic := 15;
  END IF;
  
  IF dragon_base_health IS NULL THEN
    dragon_base_health := 80;
    dragon_base_defense := 20;
    dragon_base_power := 25;
    dragon_base_magic := 30;
  END IF;

  RAISE NOTICE 'Base stats loaded - Hero: hp=%, def=%, pow=%, mag=% | Dragon: hp=%, def=%, pow=%, mag=%',
    hero_base_health, hero_base_defense, hero_base_power, hero_base_magic,
    dragon_base_health, dragon_base_defense, dragon_base_power, dragon_base_magic;

  -- Обработать все карты героев и драконов
  FOR card_record IN 
    SELECT 
      id,
      card_type,
      card_data,
      (card_data->>'rarity')::INTEGER as rarity,
      card_data->>'cardClass' as card_class_name,
      card_data->>'name' as card_name,
      current_health,
      max_health,
      current_defense,
      max_defense
    FROM card_instances 
    WHERE card_type IN ('hero', 'dragon')
  LOOP
    -- Получить множитель редкости
    SELECT multiplier INTO rarity_mult
    FROM rarity_multipliers
    WHERE rarity = card_record.rarity;
    
    IF rarity_mult IS NULL THEN
      rarity_mult := 1.0;
    END IF;

    -- Получить множители класса
    IF card_record.card_type = 'hero' THEN
      SELECT 
        health_multiplier,
        defense_multiplier,
        power_multiplier,
        magic_multiplier
      INTO health_mult, defense_mult, power_mult, magic_mult
      FROM class_multipliers
      WHERE class_name = card_record.card_class_name;
      
      -- Рассчитать характеристики для героя
      calculated_power := FLOOR(hero_base_power * rarity_mult * COALESCE(power_mult, 1.0));
      calculated_defense := FLOOR(hero_base_defense * rarity_mult * COALESCE(defense_mult, 1.0));
      calculated_health := FLOOR(hero_base_health * rarity_mult * COALESCE(health_mult, 1.0));
      calculated_magic := FLOOR(hero_base_magic * rarity_mult * COALESCE(magic_mult, 1.0));
    ELSE
      SELECT 
        health_multiplier,
        defense_multiplier,
        power_multiplier,
        magic_multiplier
      INTO health_mult, defense_mult, power_mult, magic_mult
      FROM dragon_class_multipliers
      WHERE class_name = card_record.card_class_name;
      
      -- Рассчитать характеристики для дракона
      calculated_power := FLOOR(dragon_base_power * rarity_mult * COALESCE(power_mult, 1.0));
      calculated_defense := FLOOR(dragon_base_defense * rarity_mult * COALESCE(defense_mult, 1.0));
      calculated_health := FLOOR(dragon_base_health * rarity_mult * COALESCE(health_mult, 1.0));
      calculated_magic := FLOOR(dragon_base_magic * rarity_mult * COALESCE(magic_mult, 1.0));
    END IF;

    -- Обновить card_data со ВСЕМИ характеристиками
    UPDATE card_instances
    SET 
      card_data = jsonb_set(
        jsonb_set(
          jsonb_set(
            jsonb_set(card_data::jsonb, '{power}', to_jsonb(calculated_power)),
            '{defense}', to_jsonb(calculated_defense)
          ),
          '{health}', to_jsonb(calculated_health)
        ),
        '{magic}', to_jsonb(calculated_magic)
      ),
      max_health = calculated_health,
      max_defense = calculated_defense,
      current_health = CASE 
        WHEN current_health = card_record.max_health THEN calculated_health
        ELSE LEAST(current_health, calculated_health)
      END,
      current_defense = CASE 
        WHEN current_defense = card_record.max_defense THEN calculated_defense
        ELSE LEAST(current_defense, calculated_defense)
      END,
      updated_at = now()
    WHERE id = card_record.id;
    
    RAISE NOTICE 'Updated % (%, rarity %): pow=%, def=%, hp=%, mag=%', 
      card_record.card_name, card_record.card_type, card_record.rarity,
      calculated_power, calculated_defense, calculated_health, calculated_magic;
  END LOOP;
  
  RAISE NOTICE '✅ All card stats recalculated and saved to card_data';
END $$;