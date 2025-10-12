-- Добавить Кристалл Жизни в таблицу item_templates
INSERT INTO item_templates (
  item_id,
  name,
  type,
  rarity,
  description,
  source_type,
  source_details,
  drop_chance,
  level_requirement,
  value,
  image_url
) VALUES (
  'life_crystal',
  'Кристалл Жизни',
  'material',
  'legendary',
  'Редчайший кристалл, пульсирующий жизненной энергией. Можно добыть из монстров в Гнездо Гигантских Пауков',
  'monster_drop',
  '{"monster_types": ["Все монстры в Гнездо Гигантских Пауков"], "drop_locations": ["spider_nest"]}'::jsonb,
  1.0,
  1,
  150,
  '/src/assets/items/life-crystal.png'
)
ON CONFLICT (item_id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  value = EXCLUDED.value,
  drop_chance = EXCLUDED.drop_chance,
  image_url = EXCLUDED.image_url;