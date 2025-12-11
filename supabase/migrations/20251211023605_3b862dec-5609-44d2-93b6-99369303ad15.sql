-- Лиорас: Природа - силен против Земли, слаб против Тьмы
UPDATE public.faction_elements 
SET weak_against = 'darkness' 
WHERE faction_name = 'Лиорас';

-- Костяное подземелье: Земля (не Тьма)
UPDATE public.dungeon_settings 
SET dungeon_element = 'earth' 
WHERE dungeon_type = 'bone_dungeon';