-- Исправляем card_template_id для всех worker карт согласно их именам
UPDATE card_instances 
SET card_template_id = 'worker_1'
WHERE card_data->>'name' = 'Пылевой Батрак' AND card_data->>'type' = 'worker';

UPDATE card_instances 
SET card_template_id = 'worker_2'
WHERE card_data->>'name' = 'Угольный Носильщик' AND card_data->>'type' = 'worker';

UPDATE card_instances 
SET card_template_id = 'worker_3'
WHERE card_data->>'name' = 'Ремесленник' AND card_data->>'type' = 'worker';

UPDATE card_instances 
SET card_template_id = 'worker_4'
WHERE card_data->>'name' = 'Мастер' AND card_data->>'type' = 'worker';

UPDATE card_instances 
SET card_template_id = 'worker_5'
WHERE card_data->>'name' = 'Виртуоз' AND card_data->>'type' = 'worker';

UPDATE card_instances 
SET card_template_id = 'worker_6'
WHERE card_data->>'name' = 'Гроссмейстер' AND card_data->>'type' = 'worker';

UPDATE card_instances 
SET card_template_id = 'worker_7'
WHERE card_data->>'name' = 'Владыка ремесел' AND card_data->>'type' = 'worker';

UPDATE card_instances 
SET card_template_id = 'worker_8'
WHERE card_data->>'name' = 'Архонт мануфактур' AND card_data->>'type' = 'worker';

-- Удаляем неверные записи из card_instances
DELETE FROM card_instances 
WHERE card_data->>'name' IN ('Верховный Архимастер', 'Божественный Творец');

-- Удаляем неверные записи из game_data.cards
UPDATE game_data 
SET cards = (
  SELECT COALESCE(jsonb_agg(card), '[]'::jsonb)
  FROM jsonb_array_elements(cards) AS card
  WHERE card->>'name' NOT IN ('Верховный Архимастер', 'Божественный Творец')
)
WHERE cards::text LIKE '%Верховный Архимастер%' OR cards::text LIKE '%Божественный Творец%';