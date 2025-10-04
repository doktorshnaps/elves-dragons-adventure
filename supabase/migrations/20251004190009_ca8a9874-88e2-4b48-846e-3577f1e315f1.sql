-- Исправляем порядок подземелий согласно сложности
-- 1 - самое слабое, 8 - самое сложное

UPDATE dungeon_settings SET dungeon_number = 1 WHERE dungeon_type = 'spider_nest';
UPDATE dungeon_settings SET dungeon_number = 2 WHERE dungeon_type = 'bone_dungeon';
UPDATE dungeon_settings SET dungeon_number = 3 WHERE dungeon_type = 'dark_mage';
UPDATE dungeon_settings SET dungeon_number = 4 WHERE dungeon_type = 'forgotten_souls';
UPDATE dungeon_settings SET dungeon_number = 5 WHERE dungeon_type = 'ice_throne';
UPDATE dungeon_settings SET dungeon_number = 6 WHERE dungeon_type = 'sea_serpent';
UPDATE dungeon_settings SET dungeon_number = 7 WHERE dungeon_type = 'dragon_lair';
UPDATE dungeon_settings SET dungeon_number = 8 WHERE dungeon_type = 'pantheon_gods';