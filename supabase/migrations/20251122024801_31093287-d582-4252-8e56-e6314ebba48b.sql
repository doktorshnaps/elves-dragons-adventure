-- Рассчитать и установить health для всех существующих карт где он не рассчитан корректно
DO $$
DECLARE
  hero_base_health INTEGER;
  dragon_base_health INTEGER;
  card_record RECORD;
  calculated_health INTEGER;
  rarity_mult NUMERIC;
  health_mult NUMERIC;
BEGIN
  -- Получить базовые значения health
  SELECT health INTO hero_base_health FROM hero_base_stats LIMIT 1;
  SELECT health INTO dragon_base_health FROM dragon_base_stats LIMIT 1;
  
  -- Установить значения по умолчанию если таблицы пусты
  IF hero_base_health IS NULL THEN
    hero_base_health := 100;
  END IF;
  IF dragon_base_health IS NULL THEN
    dragon_base_health := 80;
  END IF;

  -- Обработать все карты, где health не рассчитан (равен 100 для героев и 80 для драконов)
  FOR card_record IN 
    SELECT 
      id,
      card_type,
      card_data,
      (card_data->>'rarity')::INTEGER as rarity,
      card_data->>'cardClass' as card_class_name,
      current_health,
      max_health
    FROM card_instances 
    WHERE card_type IN ('hero', 'dragon')
      AND ((card_type = 'hero' AND max_health = 100) OR (card_type = 'dragon' AND max_health = 80))
  LOOP
    -- Получить множитель редкости
    SELECT multiplier INTO rarity_mult
    FROM rarity_multipliers
    WHERE rarity = card_record.rarity;
    
    IF rarity_mult IS NULL THEN
      rarity_mult := 1.0;
    END IF;

    -- Получить множитель класса
    IF card_record.card_type = 'hero' THEN
      SELECT health_multiplier INTO health_mult
      FROM class_multipliers
      WHERE class_name = card_record.card_class_name;
    ELSE
      SELECT health_multiplier INTO health_mult
      FROM dragon_class_multipliers
      WHERE class_name = card_record.card_class_name;
    END IF;
    
    IF health_mult IS NULL THEN
      health_mult := 1.0;
    END IF;

    -- Рассчитать health
    IF card_record.card_type = 'hero' THEN
      calculated_health := FLOOR(hero_base_health * rarity_mult * health_mult);
    ELSE
      calculated_health := FLOOR(dragon_base_health * rarity_mult * health_mult);
    END IF;

    -- Обновить card_data, max_health и current_health
    UPDATE card_instances
    SET 
      card_data = jsonb_set(card_data::jsonb, '{health}', to_jsonb(calculated_health)),
      max_health = calculated_health,
      current_health = CASE 
        WHEN current_health = card_record.max_health THEN calculated_health
        ELSE LEAST(current_health, calculated_health)
      END
    WHERE id = card_record.id;
    
    RAISE NOTICE 'Updated card % (type: %, rarity: %, class: %): health = % (was: current=%, max=%)', 
      card_record.id, card_record.card_type, card_record.rarity, card_record.card_class_name, 
      calculated_health, card_record.current_health, card_record.max_health;
  END LOOP;
  
  RAISE NOTICE 'Health calculation complete for all existing cards';
END $$;