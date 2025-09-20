-- Сначала проверим и обновим существующие записи рабочих
UPDATE item_templates SET 
  item_id = 'worker_2',
  name = 'Пылевой Батрак',
  description = 'Обычный рабочий. Работает 2 часа, ускорение +10%',
  stats = '{"speedBoost": 10, "workDuration": 7200000}',
  value = 5,
  rarity = 'common',
  image_url = '/src/assets/workers/pylevoy-batrak.png'
WHERE id = 2 AND type = 'worker';

UPDATE item_templates SET 
  item_id = 'worker_3',
  name = 'Угольный Носильщик',
  description = 'Опытный рабочий. Работает 4 часа, ускорение +20%',
  stats = '{"speedBoost": 20, "workDuration": 14400000}',
  value = 15,
  rarity = 'uncommon',
  image_url = '/src/assets/workers/ugolny-nosiltschik.png'
WHERE id = 3 AND type = 'worker';

UPDATE item_templates SET 
  item_id = 'worker_4',
  name = 'Ремесленник',
  description = 'Искусный рабочий. Работает 6 часов, ускорение +30%',
  stats = '{"speedBoost": 30, "workDuration": 21600000}',
  value = 30,
  rarity = 'rare',
  image_url = '/src/assets/workers/remeslennik.png'
WHERE id = 4 AND type = 'worker';

UPDATE item_templates SET 
  item_id = 'worker_5',
  name = 'Мастер',
  description = 'Талантливый рабочий. Работает 8 часов, ускорение +40%',
  stats = '{"speedBoost": 40, "workDuration": 28800000}',
  value = 50,
  rarity = 'epic',
  image_url = '/src/assets/workers/master.png'
WHERE id = 5 AND type = 'worker';

UPDATE item_templates SET 
  item_id = 'worker_6',
  name = 'Архимастер',
  description = 'Превосходный рабочий. Работает 12 часов, ускорение +50%',
  stats = '{"speedBoost": 50, "workDuration": 43200000}',
  value = 80,
  rarity = 'legendary',
  image_url = '/src/assets/workers/arkhimaster.png'
WHERE id = 6 AND type = 'worker';

UPDATE item_templates SET 
  item_id = 'worker_7',
  name = 'Гранд-мастер',
  description = 'Легендарный рабочий. Работает 18 часов, ускорение +70%',
  stats = '{"speedBoost": 70, "workDuration": 64800000}',
  value = 120,
  rarity = 'legendary',
  image_url = '/src/assets/workers/grand-master.png'
WHERE id = 7 AND type = 'worker';

UPDATE item_templates SET 
  item_id = 'worker_8',
  name = 'Владыка ремесел',
  description = 'Мифический рабочий. Работает 24 часа, ускорение +100%',
  stats = '{"speedBoost": 100, "workDuration": 86400000}',
  value = 200,
  rarity = 'mythic',
  image_url = '/src/assets/workers/vladyka-remesel.png'
WHERE id = 8 AND type = 'worker';

-- Для ID 9 проверим, существует ли он
INSERT INTO item_templates (id, item_id, name, type, rarity, description, stats, source_type, image_url, value, level_requirement) 
VALUES (9, 'worker_9', 'Архонт мануфактур', 'worker', 'divine', 'Божественный рабочий. Работает 48 часов, ускорение +150%', '{"speedBoost": 150, "workDuration": 172800000}', 'shop', '/src/assets/workers/arkhont-manufaktur.png', 400, 1)
ON CONFLICT (id) DO UPDATE SET
  item_id = 'worker_9',
  name = 'Архонт мануфактур',
  description = 'Божественный рабочий. Работает 48 часов, ускорение +150%',
  stats = '{"speedBoost": 150, "workDuration": 172800000}',
  value = 400,
  rarity = 'divine',
  image_url = '/src/assets/workers/arkhont-manufaktur.png';

-- Удаляем неверные записи ("Виртуоз" и "Гроссмейстер")
DELETE FROM item_templates WHERE name IN ('Виртуоз', 'Гроссмейстер') AND type = 'worker';

-- Удаляем неправильные записи из card_instances
DELETE FROM card_instances 
WHERE card_data->>'name' IN ('Виртуоз', 'Гроссмейстер');

-- Очищаем неправильные записи из game_data
UPDATE game_data 
SET inventory = (
  SELECT COALESCE(jsonb_agg(item), '[]'::jsonb)
  FROM jsonb_array_elements(inventory) AS item
  WHERE item->>'name' NOT IN ('Виртуоз', 'Гроссмейстер')
)
WHERE inventory::text LIKE '%Виртуоз%' OR inventory::text LIKE '%Гроссмейстер%';

UPDATE game_data 
SET cards = (
  SELECT COALESCE(jsonb_agg(card), '[]'::jsonb)
  FROM jsonb_array_elements(cards) AS card
  WHERE card->>'name' NOT IN ('Виртуоз', 'Гроссмейстер')
)
WHERE cards::text LIKE '%Виртуоз%' OR cards::text LIKE '%Гроссмейстер%';