-- Fix faction elements - Ellenar and Telerion have same strong_against and weak_against (both Darkness/Light)
-- Ellenar (Light) should be weak against something other than Darkness
-- Telerion (Darkness) should be weak against something other than Light

-- Fix Ellenar: Light - strong vs Darkness, weak vs Earth (земля поглощает свет)
UPDATE public.faction_elements 
SET weak_against = 'earth' 
WHERE faction_name = 'Ellenar';

-- Fix Telerion: Darkness - strong vs Light, weak vs Fire (огонь рассеивает тьму)
UPDATE public.faction_elements 
SET weak_against = 'fire' 
WHERE faction_name = 'Telerion';

-- Update dungeon elements to match the required configuration:
-- Паучье гнездо: Природа (nature) - already correct
-- Костяное подземелье: Тьма (darkness)
UPDATE public.dungeon_settings SET dungeon_element = 'darkness' WHERE dungeon_type = 'bone_dungeon';

-- Темный маг: Тьма (darkness)
UPDATE public.dungeon_settings SET dungeon_element = 'darkness' WHERE dungeon_type = 'dark_mage';

-- Забытые души: Тьма (darkness)
UPDATE public.dungeon_settings SET dungeon_element = 'darkness' WHERE dungeon_type = 'forgotten_souls';

-- Ледяной трон: Лёд (ice)
UPDATE public.dungeon_settings SET dungeon_element = 'ice' WHERE dungeon_type = 'ice_throne';

-- Морской змей: Вода (water)
UPDATE public.dungeon_settings SET dungeon_element = 'water' WHERE dungeon_type = 'sea_serpent';

-- Логово дракона: Огонь (fire) - already correct from previous migration
-- Пантеон богов: Свет (light)
UPDATE public.dungeon_settings SET dungeon_element = 'light' WHERE dungeon_type = 'pantheon_gods';