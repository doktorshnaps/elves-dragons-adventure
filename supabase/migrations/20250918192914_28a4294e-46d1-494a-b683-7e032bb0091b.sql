-- Обновляем названия и изображения рабочих в item_templates
UPDATE public.item_templates 
SET 
  name = 'Пылевой Батрак',
  image_url = '/src/assets/workers/pylevoy-batrak.png',
  updated_at = now()
WHERE id = 1;

UPDATE public.item_templates 
SET 
  name = 'Угольный Носильщик',
  image_url = '/src/assets/workers/ugolny-nosiltschik.png',
  updated_at = now()
WHERE id = 2;

UPDATE public.item_templates 
SET 
  image_url = '/src/assets/workers/remeslennik.png',
  updated_at = now()
WHERE id = 3;

UPDATE public.item_templates 
SET 
  image_url = '/src/assets/workers/master.png',
  updated_at = now()
WHERE id = 4;

UPDATE public.item_templates 
SET 
  image_url = '/src/assets/workers/arkhimaster.png',
  updated_at = now()
WHERE id = 5;

UPDATE public.item_templates 
SET 
  image_url = '/src/assets/workers/grand-master.png',
  updated_at = now()
WHERE id = 6;

-- Добавляем недостающие записи для более высоких уровней рабочих
INSERT INTO public.item_templates (
  id, item_id, name, type, rarity, description, value, stats, image_url, source_type
) VALUES 
  (7, 'worker_7', 'Владыка ремесел', 'worker', 'mythic', 'Мифический рабочий. Работает 24 часа, ускорение +100%', 200, '{"workDuration": 86400000, "speedBoost": 100}', null, 'shop'),
  (8, 'worker_8', 'Архонт мануфактур', 'worker', 'divine', 'Божественный рабочий. Работает 48 часов, ускорение +150%', 400, '{"workDuration": 172800000, "speedBoost": 150}', '/src/assets/workers/arkhont-manufaktur.png', 'shop')
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