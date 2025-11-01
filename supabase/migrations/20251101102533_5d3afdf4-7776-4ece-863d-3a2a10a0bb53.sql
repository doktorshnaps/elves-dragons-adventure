-- Add monster spawn configuration and separate boss stats to dungeon_settings
ALTER TABLE dungeon_settings
ADD COLUMN IF NOT EXISTS monster_spawn_config jsonb DEFAULT '{
  "normal": {"min_level": 1, "max_level": 100},
  "miniboss": {"levels": [10, 20, 30, 40, 60, 70, 80, 90]},
  "boss50": {"level": 50},
  "boss100": {"level": 100}
}'::jsonb,
ADD COLUMN IF NOT EXISTS boss_hp_multipliers jsonb DEFAULT '{
  "boss50": 2.5,
  "boss100": 4.0
}'::jsonb,
ADD COLUMN IF NOT EXISTS boss_armor_multipliers jsonb DEFAULT '{
  "boss50": 1.3,
  "boss100": 1.5
}'::jsonb,
ADD COLUMN IF NOT EXISTS boss_atk_multipliers jsonb DEFAULT '{
  "boss50": 1.1,
  "boss100": 1.15
}'::jsonb;

COMMENT ON COLUMN dungeon_settings.monster_spawn_config IS 'Configuration for which monster types spawn at which levels';
COMMENT ON COLUMN dungeon_settings.boss_hp_multipliers IS 'Separate HP multipliers for bosses, independent of base stats';
COMMENT ON COLUMN dungeon_settings.boss_armor_multipliers IS 'Separate Armor multipliers for bosses';
COMMENT ON COLUMN dungeon_settings.boss_atk_multipliers IS 'Separate ATK multipliers for bosses';