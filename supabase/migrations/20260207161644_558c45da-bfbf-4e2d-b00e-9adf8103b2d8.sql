-- Add clan_hall to building_levels for all existing game_data records that don't have it
UPDATE public.game_data
SET building_levels = building_levels || '{"clan_hall": 0}'::jsonb
WHERE building_levels IS NOT NULL
  AND NOT (building_levels ? 'clan_hall');