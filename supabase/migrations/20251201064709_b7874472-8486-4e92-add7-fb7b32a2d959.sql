
-- Fix dragon names: remove duplicate "Ординарный" entries and fix references

-- 1. Delete "Ординарный" dragons from card_templates (keep only "Обычный")
DELETE FROM public.card_templates
WHERE card_name LIKE '%Ординарный%' AND card_type = 'dragon';

-- 2. Update card_images to use "Обычный" instead of "Ординарный"
UPDATE public.card_images
SET card_name = REPLACE(card_name, 'Ординарный', 'Обычный')
WHERE card_name LIKE '%Ординарный%';

-- 3. Update card_class_mappings class_name from "Ординарный" to "Обычный"
UPDATE public.card_class_mappings
SET class_name = 'Обычный'
WHERE class_name = 'Ординарный';
