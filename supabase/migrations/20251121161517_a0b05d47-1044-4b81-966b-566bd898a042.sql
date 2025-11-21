-- Remove base drop chance from all items
-- Items should only drop if configured in dungeon_item_drops
UPDATE public.item_templates 
SET drop_chance = NULL
WHERE drop_chance IS NOT NULL;