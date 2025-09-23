-- Добавляем поля для максимальных ресурсов в таблицу game_data
ALTER TABLE public.game_data 
ADD COLUMN max_wood integer DEFAULT 0,
ADD COLUMN max_stone integer DEFAULT 0,
ADD COLUMN max_iron integer DEFAULT 0;

-- Обновляем максимальные ресурсы для существующих игроков с построенным складом
UPDATE public.game_data 
SET 
  max_wood = COALESCE((building_levels->>'storage')::integer, 0) * 100,
  max_stone = COALESCE((building_levels->>'storage')::integer, 0) * 100,
  max_iron = COALESCE((building_levels->>'storage')::integer, 0) * 100
WHERE building_levels IS NOT NULL 
  AND building_levels->>'storage' IS NOT NULL
  AND (building_levels->>'storage')::integer > 0;