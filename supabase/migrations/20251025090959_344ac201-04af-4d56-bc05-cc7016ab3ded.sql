-- Создаем storage bucket для фоновых изображений зданий
INSERT INTO storage.buckets (id, name, public)
VALUES ('building-backgrounds', 'building-backgrounds', true)
ON CONFLICT (id) DO NOTHING;

-- Добавляем поле background_image_url в building_configs
ALTER TABLE public.building_configs 
ADD COLUMN IF NOT EXISTS background_image_url TEXT;