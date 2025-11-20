-- Migration to update card class names from Mage to Wizard, Common to Ordinary, and Uncommon to Unusual
-- Update card_class_mappings table
UPDATE card_class_mappings 
SET class_name = 'Чародей' 
WHERE class_name = 'Маг';

-- Update dragon_class_multipliers table
UPDATE dragon_class_multipliers 
SET class_name = 'Ординарный' 
WHERE class_name = 'Обычный';

UPDATE dragon_class_multipliers 
SET class_name = 'Необычный' 
WHERE class_name = 'Необычный';

-- Update card_instances with new card names in card_data jsonb
UPDATE card_instances
SET card_data = jsonb_set(
  card_data,
  '{name}',
  to_jsonb(replace(card_data->>'name', 'Маг', 'Чародей'))
)
WHERE card_data->>'name' LIKE '%Маг%';

UPDATE card_instances
SET card_data = jsonb_set(
  card_data,
  '{name}',
  to_jsonb(replace(card_data->>'name', 'Обычный', 'Ординарный'))
)
WHERE card_data->>'name' LIKE '%Обычный%';

-- Update game_data.cards jsonb array
UPDATE game_data
SET cards = (
  SELECT jsonb_agg(
    CASE 
      WHEN elem->>'name' LIKE '%Маг%' THEN 
        jsonb_set(elem, '{name}', to_jsonb(replace(elem->>'name', 'Маг', 'Чародей')))
      WHEN elem->>'name' LIKE '%Обычный%' THEN
        jsonb_set(elem, '{name}', to_jsonb(replace(elem->>'name', 'Обычный', 'Ординарный')))
      ELSE elem
    END
  )
  FROM jsonb_array_elements(cards) AS elem
)
WHERE cards::text LIKE '%Маг%' OR cards::text LIKE '%Обычный%';