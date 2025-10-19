-- Обновляем некорректные типы предметов на material
UPDATE public.item_templates
SET type = 'material'
WHERE type IN ('consumable', 'armor', 'weapon', 'dragon_egg', 'accessory', 'scroll', 'tool', 'gem');