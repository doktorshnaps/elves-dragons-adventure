-- Рассчитать и установить defense для всех существующих карт где его нет
DO $$
DECLARE
  hero_base_defense INTEGER;
  dragon_base_defense INTEGER;
  card_record RECORD;
  calculated_defense INTEGER;
  rarity_mult NUMERIC;
  defense_mult NUMERIC;
  card_class TEXT;
BEGIN
  -- Получить базовые значения defense
  SELECT defense INTO hero_base_defense FROM hero_base_stats LIMIT 1;
  SELECT defense INTO dragon_base_defense FROM dragon_base_stats LIMIT 1;
  
  -- Установить значения по умолчанию если таблицы пусты
  IF hero_base_defense IS NULL THEN
    hero_base_defense := 25;
  END IF;
  IF dragon_base_defense IS NULL THEN
    dragon_base_defense := 20;
  END IF;

  -- Обработать все карты без defense
  FOR card_record IN 
    SELECT 
      id,
      card_type,
      card_data,
      (card_data->>'rarity')::INTEGER as rarity,
      card_data->>'cardClass' as card_class_name
    FROM card_instances 
    WHERE card_type IN ('hero', 'dragon')
      AND (card_data->>'defense') IS NULL
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
      SELECT defense_multiplier INTO defense_mult
      FROM class_multipliers
      WHERE class_name = card_record.card_class_name;
    ELSE
      SELECT defense_multiplier INTO defense_mult
      FROM dragon_class_multipliers
      WHERE class_name = card_record.card_class_name;
    END IF;
    
    IF defense_mult IS NULL THEN
      defense_mult := 1.0;
    END IF;

    -- Рассчитать defense
    IF card_record.card_type = 'hero' THEN
      calculated_defense := FLOOR(hero_base_defense * rarity_mult * defense_mult);
    ELSE
      calculated_defense := FLOOR(dragon_base_defense * rarity_mult * defense_mult);
    END IF;

    -- Обновить card_data, max_defense и current_defense
    UPDATE card_instances
    SET 
      card_data = jsonb_set(card_data::jsonb, '{defense}', to_jsonb(calculated_defense)),
      max_defense = calculated_defense,
      current_defense = CASE 
        WHEN current_defense = 0 THEN calculated_defense
        ELSE current_defense
      END
    WHERE id = card_record.id;
    
    RAISE NOTICE 'Updated card % (type: %, rarity: %, class: %): defense = %', 
      card_record.id, card_record.card_type, card_record.rarity, card_record.card_class_name, calculated_defense;
  END LOOP;
  
  RAISE NOTICE 'Defense calculation complete for all existing cards';
END $$;