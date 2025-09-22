-- Добавляем шаблон для карточного пакета с обязательным полем source_type
INSERT INTO public.item_templates (
  id, 
  item_id, 
  name, 
  description, 
  type, 
  value, 
  rarity,
  source_type,
  image_url,
  stats
) VALUES (
  1,
  'card_pack',
  'Колода карт',
  'Содержит 1 случайную карту героя или питомца',
  'cardPack',
  1,
  'common',
  'shop',
  '/lovable-uploads/e523dce0-4cda-4d32-b4e2-ecec40b1eb39.png',
  '{"cards_count": 1}'::jsonb
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  type = EXCLUDED.type,
  value = EXCLUDED.value,
  rarity = EXCLUDED.rarity,
  source_type = EXCLUDED.source_type,
  image_url = EXCLUDED.image_url,
  stats = EXCLUDED.stats;