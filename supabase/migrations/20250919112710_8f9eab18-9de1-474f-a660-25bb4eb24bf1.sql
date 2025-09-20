-- Add new item templates to the database
INSERT INTO public.item_templates (
  item_id, name, type, rarity, description, stats, source_type, image_url, drop_chance, level_requirement, value
) VALUES 
-- Клык берсерка (Berserker Fang) - weapon
('berserker_fang', 'Клык берсерка', 'weapon', 'epic', 'Искривленный и зазубренный, на нем осталась ярость владельца.', 
 '{"power": 85, "attack_speed": 15}', 'boss_drop', '/src/assets/items/berserker-fang.png', 0.05, 45, 8500),

-- Сердце виверны (Wyvern Heart) - consumable/material  
('wyvern_heart', 'Сердце виверны', 'consumable', 'legendary', 'Мышечный орган, содержащий элементальную энергию.',
 '{"elemental_power": 100, "magic_resistance": 25}', 'boss_drop', '/src/assets/items/wyvern-heart.png', 0.02, 50, 15000),

-- Панцирь титана (Titan Shell) - armor
('titan_shell', 'Панцирь титана', 'armor', 'legendary', 'Невероятно прочный фрагмент, размером с щит.',
 '{"defense": 120, "health": 200}', 'boss_drop', '/src/assets/items/titan-shell.png', 0.03, 55, 18000),

-- Коготь трупоеда (Carrion Claw) - weapon
('carrion_claw', 'Коготь трупоеда', 'weapon', 'rare', 'Зараженный орган, наносящий гнилостные раны.',
 '{"power": 65, "poison_damage": 30, "lifesteal": 10}', 'monster_drop', '/src/assets/items/carrion-claw.png', 0.08, 35, 4500),

-- Железа паразита (Parasite Gland) - consumable/material
('parasite_gland', 'Железа паразита', 'consumable', 'epic', 'Вырабатывает вещества для контроля над разумом.',
 '{"mind_control": 50, "magic_power": 40}', 'monster_drop', '/src/assets/items/parasite-gland.png', 0.06, 40, 6000),

-- Яйцо стражи (Guardian Egg) - special pet item
('guardian_egg', 'Яйцо стражи', 'dragon_egg', 'legendary', 'Большое яйцо, из которого можно вырастить питомца-паука.',
 '{"hatch_time": 7200, "pet_type": "guardian_spider"}', 'boss_drop', '/src/assets/items/guardian-egg.png', 0.01, 60, 25000),

-- Символ паутины (Web Symbol) - accessory
('web_symbol', 'Символ паутины', 'accessory', 'epic', 'Металлический знак, обозначающий принадлежность к культу.',
 '{"magic_power": 75, "web_mastery": 25, "cult_affinity": 50}', 'quest_reward', '/src/assets/items/web-symbol.png', 1.0, 45, 7500),

-- Посох Архимага (Archmage Staff) - weapon
('archmage_staff', 'Посох Архимага', 'weapon', 'legendary', 'Фокусник, усиливающий магию Тьмы и Крови.',
 '{"magic_power": 150, "dark_magic": 75, "blood_magic": 75}', 'boss_drop', '/src/assets/items/archmage-staff.png', 0.015, 65, 22000),

-- Мантия из живой тени (Living Shadow Mantle) - armor
('living_shadow_mantle', 'Мантия из живой тени', 'armor', 'legendary', 'Делает владельца почти невидимым в темноте.',
 '{"defense": 80, "stealth": 90, "shadow_resistance": 100}', 'boss_drop', '/src/assets/items/living-shadow-mantle.png', 0.02, 60, 20000),

-- Гримуар арахнидных заклинаний (Arachnid Spells Grimoire) - accessory
('arachnid_grimoire', 'Гримуар арахнидных заклинаний', 'accessory', 'legendary', 'Книга с магией, доступной только не-людям.',
 '{"magic_power": 200, "arachnid_spells": 100, "spell_unlock": true}', 'quest_reward', '/src/assets/items/arachnid-grimoire.png', 1.0, 70, 30000);