-- Добавляем новые предметы в таблицу item_templates
INSERT INTO item_templates (
  item_id, name, type, rarity, description, stats, source_type, source_details, 
  drop_chance, level_requirement, value, image_url
) VALUES 
-- Древесные чурки
(
  'wood_chunks', 'Древесные чурки', 'material', 'common', 
  'Крепкие куски древесины, пропитанные магической энергией.',
  '{}', 'craft', '{"materials": []}', 0.15, 1, 15, '/src/assets/items/wood-chunks.jpeg'
),
-- Остатки магических корней
(
  'magical_roots', 'Остатки магических корней', 'material', 'rare', 
  'Корни древних магических растений, хранящие в себе силу земли.',
  '{}', 'monster_drop', '{"monster_types": ["Лесные духи", "Энты"]}', 0.08, 5, 25, '/src/assets/items/magical-roots.jpeg'
),
-- Камни горной породы
(
  'rock_stones', 'Камни горной породы', 'material', 'common', 
  'Твердые обломки горных пород с вкраплениями минералов.',
  '{}', 'monster_drop', '{"monster_types": ["Горные тролли", "Каменные големы"]}', 0.20, 1, 10, '/src/assets/items/rock-stones.jpeg'
),
-- Черные кристаллы земляных духов
(
  'black_crystals', 'Черные кристаллы земляных духов', 'material', 'epic', 
  'Темные кристаллы, наполненные энергией земляных духов.',
  '{}', 'monster_drop', '{"monster_types": ["Земляные духи", "Темные элементали"]}', 0.05, 15, 50, '/src/assets/items/black-crystals.jpeg'
),
-- Манускрипт иллюзорных откровений
(
  'illusion_manuscript', 'Манускрипт иллюзорных откровений', 'scroll', 'legendary', 
  'Древний свиток с заклинаниями иллюзий и откровений.',
  '{"magic": 50, "wisdom": 30}', 'quest_reward', '{"quest": "Тайны древних магов"}', 0.01, 25, 100, '/src/assets/items/illusion-manuscript.png'
),
-- Магический монокль тьмы
(
  'dark_monocle', 'Магический монокль тьмы', 'accessory', 'epic', 
  'Волшебный монокль, позволяющий видеть сквозь тьму.',
  '{"vision": 40, "magic": 20}', 'craft', '{"materials": [{"item": "Черные кристаллы земляных духов", "count": 3}]}', 0.03, 20, 75, '/src/assets/items/dark-monocle.png'
),
-- Плетёная жила эфирной лозы
(
  'ether_vine', 'Плетёная жила эфирной лозы', 'material', 'rare', 
  'Гибкие волокна эфирной лозы, светящиеся магическим светом.',
  '{}', 'monster_drop', '{"monster_types": ["Эфирные создания", "Лесные феи"]}', 0.10, 10, 40, '/src/assets/items/ether-vine.png'
),
-- Клещи из серебра древних гномов
(
  'dwarven_tongs', 'Клещи из серебра древних гномов', 'tool', 'epic', 
  'Инструмент мастеров-гномов из чистого серебра.',
  '{"crafting": 60, "durability": 100}', 'quest_reward', '{"quest": "Наследие гномьих кузнецов"}', 0.02, 30, 80, '/src/assets/items/dwarven-tongs.png'
),
-- Масло Целительного Прощения
(
  'healing_oil', 'Масло Целительного Прощения', 'consumable', 'rare', 
  'Волшебное масло с мощными целебными свойствами.',
  '{"healing": 150}', 'craft', '{"materials": [{"item": "Остатки магических корней", "count": 2}, {"item": "Плетёная жила эфирной лозы", "count": 1}]}', 0.08, 15, 60, '/src/assets/items/healing-oil.png'
),
-- Мерцающий мерный кристалл
(
  'shimmering_crystal', 'Мерцающий мерный кристалл', 'gem', 'legendary', 
  'Кристалл, мерцающий внутренним светом и хранящий древние знания.',
  '{"magic": 80, "mana": 200}', 'monster_drop', '{"monster_types": ["Древние драконы", "Кристальные стражи"]}', 0.005, 40, 90, '/src/assets/items/shimmering-crystal.png'
);