-- Исправить health для ВСЕХ карт где он не рассчитан корректно
-- Ищем все карты где card_data->>'health' IS NULL или не совпадает с max_health
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

  -- Обработать все карты где health явно неправильный
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
      AND (
        -- Либо card_data не содержит health
        (card_data->>'health' IS NULL)
        -- Либо max_health подозрительно низкий (меньше базового значения * 2)
        OR (card_type = 'hero' AND max_health <= hero_base_health * 2)
        OR (card_type = 'dragon' AND max_health <= dragon_base_health * 2)
      )
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

    -- Обновить только если рассчитанное здоровье отличается от текущего max_health
    IF calculated_health != card_record.max_health THEN
      UPDATE card_instances
      SET 
        card_data = jsonb_set(card_data::jsonb, '{health}', to_jsonb(calculated_health)),
        max_health = calculated_health,
        current_health = CASE 
          WHEN current_health = card_record.max_health THEN calculated_health
          ELSE LEAST(current_health, calculated_health)
        END,
        updated_at = now()
      WHERE id = card_record.id;
      
      RAISE NOTICE 'Updated card % (type: %, rarity: %, class: %): health = % (was: current=%, max=%)', 
        card_record.id, card_record.card_type, card_record.rarity, card_record.card_class_name, 
        calculated_health, card_record.current_health, card_record.max_health;
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Health recalculation complete for all cards';
END $$;