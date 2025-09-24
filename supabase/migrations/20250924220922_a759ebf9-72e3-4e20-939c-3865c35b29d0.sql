-- Добавляем поля для сохранения состояния производства ресурсов в БД
ALTER TABLE public.game_data 
ADD COLUMN wood_last_collection_time bigint DEFAULT extract(epoch from now()) * 1000,
ADD COLUMN stone_last_collection_time bigint DEFAULT extract(epoch from now()) * 1000,
ADD COLUMN wood_production_data jsonb DEFAULT '{"isProducing": true, "isStorageFull": false}'::jsonb,
ADD COLUMN stone_production_data jsonb DEFAULT '{"isProducing": true, "isStorageFull": false}'::jsonb;