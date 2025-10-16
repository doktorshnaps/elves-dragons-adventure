-- Добавляем колонку faction в таблицу card_images
ALTER TABLE public.card_images 
ADD COLUMN IF NOT EXISTS faction TEXT;

-- Удаляем старый уникальный индекс
ALTER TABLE public.card_images 
DROP CONSTRAINT IF EXISTS card_images_card_name_card_type_rarity_key;

-- Создаем новый уникальный индекс с учетом фракции
CREATE UNIQUE INDEX IF NOT EXISTS card_images_unique_key 
ON public.card_images(card_name, card_type, rarity, COALESCE(faction, ''));

-- Обновляем индекс для быстрого поиска
DROP INDEX IF EXISTS idx_card_images_lookup;
CREATE INDEX idx_card_images_lookup 
ON public.card_images(card_name, card_type, rarity, faction);