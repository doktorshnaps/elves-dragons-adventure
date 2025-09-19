-- Add new item templates to the database
INSERT INTO public.item_templates (
  name, type, rarity, description, stats, source_type, image_url, drop_rate, required_level
) VALUES 
-- Клык берсерка (Berserker Fang) - weapon
('Клык берсерка', 'weapon', 'epic', 'Искривленный и зазубренный, на нем осталась ярость владельца.', 
 '{"power": 85, "attack_speed": 15}', 'boss_drop', '/src/assets/items/berserker-fang.png', 0.05, 45),

-- Сердце виверны (Wyvern Heart) - consumable/material  
('Сердце виверны', 'consumable', 'legendary', 'Мышечный орган, содержащий элементальную энергию.',
 '{"elemental_power": 100, "magic_resistance": 25}', 'boss_drop', '/src/assets/items/wyvern-heart.png', 0.02, 50),

-- Панцирь титана (Titan Shell) - armor
('Панцирь титана', 'armor', 'legendary', 'Невероятно прочный фрагмент, размером с щит.',
 '{"defense": 120, "health": 200}', 'boss_drop', '/src/assets/items/titan-shell.png', 0.03, 55),

-- Коготь трупоеда (Carrion Claw) - weapon
('Коготь трупоеда', 'weapon', 'rare', 'Зараженный орган, наносящий гнилостные раны.',
 '{"power": 65, "poison_damage": 30, "lifesteal": 10}', 'monster_drop', '/src/assets/items/carrion-claw.png', 0.08, 35),

-- Железа паразита (Parasite Gland) - consumable/material
('Железа паразита', 'consumable', 'epic', 'Вырабатывает вещества для контроля над разумом.',
 '{"mind_control": 50, "magic_power": 40}', 'monster_drop', '/src/assets/items/parasite-gland.png', 0.06, 40),

-- Яйцо стражи (Guardian Egg) - special pet item
('Яйцо стражи', 'dragon_egg', 'legendary', 'Большое яйцо, из которого можно вырастить питомца-паука.',
 '{"hatch_time": 7200, "pet_type": "guardian_spider"}', 'boss_drop', '/src/assets/items/guardian-egg.png', 0.01, 60),

-- Символ паутины (Web Symbol) - accessory
('Символ паутины', 'accessory', 'epic', 'Металлический знак, обозначающий принадлежность к культу.',
 '{"magic_power": 75, "web_mastery": 25, "cult_affinity": 50}', 'quest_reward', '/src/assets/items/web-symbol.png', 1.0, 45),

-- Посох Архимага (Archmage Staff) - weapon
('Посох Архимага', 'weapon', 'legendary', 'Фокусник, усиливающий магию Тьмы и Крови.',
 '{"magic_power": 150, "dark_magic": 75, "blood_magic": 75}', 'boss_drop', '/src/assets/items/archmage-staff.png', 0.015, 65),

-- Мантия из живой тени (Living Shadow Mantle) - armor
('Мантия из живой тени', 'armor', 'legendary', 'Делает владельца почти невидимым в темноте.',
 '{"defense": 80, "stealth": 90, "shadow_resistance": 100}', 'boss_drop', '/src/assets/items/living-shadow-mantle.png', 0.02, 60),

-- Гримуар арахнидных заклинаний (Arachnid Spells Grimoire) - accessory
('Гримуар арахнидных заклинаний', 'accessory', 'legendary', 'Книга с магией, доступной только не-людям.',
 '{"magic_power": 200, "arachnid_spells": 100, "spell_unlock": true}', 'quest_reward', '/src/assets/items/arachnid-grimoire.png', 1.0, 70);