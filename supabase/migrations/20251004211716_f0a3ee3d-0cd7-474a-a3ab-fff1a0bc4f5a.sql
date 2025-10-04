-- Удаляем устаревшие столбцы из dungeon_settings
ALTER TABLE public.dungeon_settings
DROP COLUMN IF EXISTS hp_growth_coefficient,
DROP COLUMN IF EXISTS armor_growth_coefficient,
DROP COLUMN IF EXISTS atk_growth_coefficient,
DROP COLUMN IF EXISTS s_mob_base,
DROP COLUMN IF EXISTS dungeon_alpha,
DROP COLUMN IF EXISTS level_beta,
DROP COLUMN IF EXISTS level_g_coefficient;