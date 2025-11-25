-- Обновляем имя "Маг" на "Чародей" во всех записях card_instances где это hero/character
UPDATE card_instances
SET card_data = jsonb_set(
  card_data,
  '{name}',
  to_jsonb(replace(card_data->>'name', 'Маг', 'Чародей'))
)
WHERE card_type IN ('hero', 'character')
  AND card_data->>'name' LIKE '%Маг%';

-- Проверяем результат
SELECT 
  id,
  card_data->>'name' as name,
  card_data->>'cardClass' as card_class,
  card_type
FROM card_instances 
WHERE card_data->>'name' LIKE '%Чародей%' OR card_data->>'cardClass' = 'Чародей'
LIMIT 5;