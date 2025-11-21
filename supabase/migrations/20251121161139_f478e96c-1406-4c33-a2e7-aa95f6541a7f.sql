-- Set sell_price to 1 ELL for all items
UPDATE public.item_templates 
SET sell_price = 1
WHERE sell_price IS NULL OR sell_price != 1;