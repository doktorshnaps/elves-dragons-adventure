-- Добавляем новое поле building_levels в таблицу game_data для хранения уровней зданий
ALTER TABLE public.game_data 
ADD COLUMN building_levels jsonb DEFAULT '{
  "main_hall": 0,
  "workshop": 0, 
  "storage": 0,
  "sawmill": 0,
  "quarry": 0,
  "barracks": 0,
  "dragon_lair": 0,
  "medical": 0
}'::jsonb;