-- Удаляем все записи рабочих (worker) и старую запись "Архонт мануфактур"
DELETE FROM item_templates WHERE type = 'worker' OR (id = 9 AND name = 'Архонт мануфактур');

-- Удаляем shop_inventory записи для рабочих чтобы пересоздать с правильными ID
DELETE FROM shop_inventory WHERE item_id BETWEEN 2 AND 9;

-- Добавляем правильные записи рабочих согласно shopItems.ts
INSERT INTO item_templates (id, item_id, name, type, rarity, description, stats, source_type, image_url, value, level_requirement) VALUES
(2, 'worker_2', 'Пылевой Батрак', 'worker', 'common', 'Обычный рабочий. Работает 2 часа, ускорение +10%', '{"speedBoost": 10, "workDuration": 7200000}', 'shop', '/src/assets/workers/pylevoy-batrak.png', 5, 1),
(3, 'worker_3', 'Угольный Носильщик', 'worker', 'uncommon', 'Опытный рабочий. Работает 4 часа, ускорение +20%', '{"speedBoost": 20, "workDuration": 14400000}', 'shop', '/src/assets/workers/ugolny-nosiltschik.png', 15, 1),
(4, 'worker_4', 'Ремесленник', 'worker', 'rare', 'Искусный рабочий. Работает 6 часов, ускорение +30%', '{"speedBoost": 30, "workDuration": 21600000}', 'shop', '/src/assets/workers/remeslennik.png', 30, 1),
(5, 'worker_5', 'Мастер', 'worker', 'epic', 'Талантливый рабочий. Работает 8 часов, ускорение +40%', '{"speedBoost": 40, "workDuration": 28800000}', 'shop', '/src/assets/workers/master.png', 50, 1),
(6, 'worker_6', 'Архимастер', 'worker', 'legendary', 'Превосходный рабочий. Работает 12 часов, ускорение +50%', '{"speedBoost": 50, "workDuration": 43200000}', 'shop', '/src/assets/workers/arkhimaster.png', 80, 1),
(7, 'worker_7', 'Гранд-мастер', 'worker', 'legendary', 'Легендарный рабочий. Работает 18 часов, ускорение +70%', '{"speedBoost": 70, "workDuration": 64800000}', 'shop', '/src/assets/workers/grand-master.png', 120, 1),
(8, 'worker_8', 'Владыка ремесел', 'worker', 'mythic', 'Мифический рабочий. Работает 24 часа, ускорение +100%', '{"speedBoost": 100, "workDuration": 86400000}', 'shop', '/src/assets/workers/vladyka-remesel.png', 200, 1),
(9, 'worker_9', 'Архонт мануфактур', 'worker', 'divine', 'Божественный рабочий. Работает 48 часов, ускорение +150%', '{"speedBoost": 150, "workDuration": 172800000}', 'shop', '/src/assets/workers/arkhont-manufaktur.png', 400, 1);

-- Восстанавливаем shop_inventory с правильными item_id
INSERT INTO shop_inventory (item_id, available_quantity, last_reset_time, next_reset_time) VALUES
(1, 50, now(), now() + interval '8 hours'),
(2, 50, now(), now() + interval '8 hours'),
(3, 50, now(), now() + interval '8 hours'),
(4, 50, now(), now() + interval '8 hours'),
(5, 50, now(), now() + interval '8 hours'),
(6, 50, now(), now() + interval '8 hours'),
(7, 50, now(), now() + interval '8 hours'),
(8, 50, now(), now() + interval '8 hours'),
(9, 50, now(), now() + interval '8 hours');

-- Удаляем неправильные записи из card_instances
DELETE FROM card_instances 
WHERE card_data->>'name' IN ('Виртуоз', 'Гроссмейстер');

-- Удаляем неправильные записи из game_data.inventory и cards
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