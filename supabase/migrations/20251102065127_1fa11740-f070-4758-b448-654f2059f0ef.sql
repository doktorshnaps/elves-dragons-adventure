-- Delete old monster records
DELETE FROM monsters WHERE created_by_wallet_address = 'mr_bruts.tg';

-- Insert correct monsters from grimoire
INSERT INTO monsters (monster_id, monster_name, monster_type, description, created_by_wallet_address) VALUES
-- Dungeon 1: Spider Nest
('spider_skeleton', 'Паучок-скелет', 'normal', 'Маленький скелет паука', 'mr_bruts.tg'),
('spider_hunter', 'Паук-охотник', 'normal', 'Ловкий охотник', 'mr_bruts.tg'),
('spider_berserker', 'Паук-берсерк', 'normal', 'Агрессивный паук', 'mr_bruts.tg'),
('spider_shadow', 'Теневой паук', 'normal', 'Паук из тени', 'mr_bruts.tg'),
('spider_ancient', 'Древний паук', 'normal', 'Древнее существо', 'mr_bruts.tg'),
('spider_titan', 'Паук-титан', 'normal', 'Гигантский паук', 'mr_bruts.tg'),
('spider_poison', 'Ядовитый паук', 'normal', 'Опасный ядом', 'mr_bruts.tg'),
('spider_necromancer', 'Паук-некромант', 'normal', 'Темная магия', 'mr_bruts.tg'),
('spider_archmage', 'Паук-архимаг', 'normal', 'Мастер магии', 'mr_bruts.tg'),
('spider_legendary', 'Легендарный паук', 'normal', 'Редчайший паук', 'mr_bruts.tg'),
('spider_giant_guard', 'Гигантский Паук-Страж', 'miniboss', 'Страж гнезда', 'mr_bruts.tg'),
('spider_queen', 'Королева Пауков', 'boss', 'Правительница гнезда', 'mr_bruts.tg'),
('arachna_progenitor', 'Арахна Прародительница', 'boss', 'Древняя прародительница пауков', 'mr_bruts.tg'),

-- Dungeon 2: Bone Dungeon
('skeleton_warrior', 'Скелет-воин', 'normal', 'Костяной воин', 'mr_bruts.tg'),
('skeleton_mage', 'Скелет-маг', 'normal', 'Костяной маг', 'mr_bruts.tg'),
('skeleton_archer', 'Скелет-лучник', 'normal', 'Костяной лучник', 'mr_bruts.tg'),
('bone_dragon', 'Костяной дракон', 'miniboss', 'Дракон из костей', 'mr_bruts.tg'),
('skeleton_king', 'Король скелетов', 'boss', 'Правитель костяного царства', 'mr_bruts.tg'),

-- Dungeon 3: Dark Mage Tower
('dark_mage', 'Тёмный маг', 'normal', 'Служитель тьмы', 'mr_bruts.tg'),
('dark_archmage', 'Тёмный архимаг', 'miniboss', 'Мастер темной магии', 'mr_bruts.tg'),
('darkness_lord', 'Повелитель тьмы', 'boss', 'Владыка темной башни', 'mr_bruts.tg'),

-- Dungeon 4: Forgotten Souls Cave
('forgotten_soul', 'Забытая душа', 'normal', 'Потерянная душа', 'mr_bruts.tg'),
('ghost_spirit', 'Призрачный дух', 'miniboss', 'Дух из прошлого', 'mr_bruts.tg'),
('ancient_soul', 'Древняя душа', 'boss', 'Древнейшая душа', 'mr_bruts.tg'),

-- Dungeon 5: Icy Throne
('ice_warrior', 'Ледяной воин', 'normal', 'Воин льда', 'mr_bruts.tg'),
('ice_mage', 'Ледяной маг', 'miniboss', 'Маг льда', 'mr_bruts.tg'),
('ice_king', 'Ледяной король', 'boss', 'Повелитель льдов', 'mr_bruts.tg'),

-- Dungeon 6: Sea Serpent Lair
('sea_serpent', 'Морской змей', 'normal', 'Змей морских глубин', 'mr_bruts.tg'),
('giant_sea_serpent', 'Гигантский морской змей', 'miniboss', 'Огромный змей', 'mr_bruts.tg'),
('sea_serpent_lord', 'Повелитель морских змеев', 'boss', 'Владыка морей', 'mr_bruts.tg'),

-- Dungeon 7: Pantheon of Gods
('divine_guard', 'Божественный страж', 'normal', 'Страж богов', 'mr_bruts.tg'),
('lesser_god', 'Младший бог', 'miniboss', 'Младшее божество', 'mr_bruts.tg'),
('ancient_god', 'Древний бог', 'boss', 'Древнее божество', 'mr_bruts.tg'),

-- Dungeon 8: Future dungeon
('unknown_enemy', 'Неизвестный враг', 'normal', 'Загадочный противник', 'mr_bruts.tg');