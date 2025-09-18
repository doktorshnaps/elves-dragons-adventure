-- Добавляем изображение для Владыки ремесел
UPDATE public.item_templates 
SET 
  image_url = '/src/assets/workers/vladyka-remesel.png',
  updated_at = now()
WHERE id = 7;