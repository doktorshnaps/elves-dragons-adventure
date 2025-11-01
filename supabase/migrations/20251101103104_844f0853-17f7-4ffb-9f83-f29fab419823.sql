-- Add miniboss multipliers to dungeon_settings
ALTER TABLE dungeon_settings
ADD COLUMN IF NOT EXISTS miniboss_hp_multiplier numeric DEFAULT 1.5,
ADD COLUMN IF NOT EXISTS miniboss_armor_multiplier numeric DEFAULT 1.5,
ADD COLUMN IF NOT EXISTS miniboss_atk_multiplier numeric DEFAULT 1.5;

COMMENT ON COLUMN dungeon_settings.miniboss_hp_multiplier IS 'HP multiplier for minibosses';
COMMENT ON COLUMN dungeon_settings.miniboss_armor_multiplier IS 'Armor multiplier for minibosses';
COMMENT ON COLUMN dungeon_settings.miniboss_atk_multiplier IS 'ATK multiplier for minibosses';