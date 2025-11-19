-- Добавляем forge в building_levels для существующих игроков
UPDATE game_data
SET building_levels = jsonb_set(
  COALESCE(building_levels, '{}'::jsonb),
  '{forge}',
  '0'
)
WHERE building_levels IS NULL OR NOT building_levels ? 'forge';