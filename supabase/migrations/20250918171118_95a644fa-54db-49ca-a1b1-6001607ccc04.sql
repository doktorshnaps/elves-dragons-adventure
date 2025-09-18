-- Добавляем шаблоны рабочих в item_templates
INSERT INTO public.item_templates (
  id, item_id, name, type, rarity, description, value, stats, image_url, source_type
) VALUES 
  (1, 'worker_1', 'Подмастерье', 'worker', 'common', 'Обычный рабочий. Работает 2 часа, ускорение +10%', 5, '{"workDuration": 7200000, "speedBoost": 10}', '/worker-1.png', 'shop'),
  (2, 'worker_2', 'Мастеровой', 'worker', 'uncommon', 'Опытный рабочий. Работает 4 часа, ускорение +20%', 15, '{"workDuration": 14400000, "speedBoost": 20}', '/worker-2.png', 'shop'),
  (3, 'worker_3', 'Ремесленник', 'worker', 'rare', 'Искусный рабочий. Работает 6 часов, ускорение +30%', 30, '{"workDuration": 21600000, "speedBoost": 30}', '/worker-3.png', 'shop'),
  (4, 'worker_4', 'Мастер', 'worker', 'epic', 'Талантливый рабочий. Работает 8 часов, ускорение +40%', 50, '{"workDuration": 28800000, "speedBoost": 40}', '/worker-4.png', 'shop'),
  (5, 'worker_5', 'Виртуоз', 'worker', 'legendary', 'Превосходный рабочий. Работает 12 часов, ускорение +60%', 100, '{"workDuration": 43200000, "speedBoost": 60}', '/worker-5.png', 'shop'),
  (6, 'worker_6', 'Гроссмейстер', 'worker', 'mythic', 'Легендарный рабочий. Работает 24 часа, ускорение +100%', 200, '{"workDuration": 86400000, "speedBoost": 100}', '/worker-6.png', 'shop')
ON CONFLICT (id) DO UPDATE SET
  item_id = EXCLUDED.item_id,
  name = EXCLUDED.name,
  type = EXCLUDED.type,
  rarity = EXCLUDED.rarity,
  description = EXCLUDED.description,
  value = EXCLUDED.value,
  stats = EXCLUDED.stats,
  image_url = EXCLUDED.image_url,
  source_type = EXCLUDED.source_type,
  updated_at = now();