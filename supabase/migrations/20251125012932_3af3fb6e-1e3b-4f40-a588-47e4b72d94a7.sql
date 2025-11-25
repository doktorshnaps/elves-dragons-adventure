-- Обновляем пути к изображениям карт: меняем .png на .webp в card_data->image
-- Это исправит отображение изображений на всех страницах кроме боя

UPDATE card_instances
SET card_data = jsonb_set(
  card_data,
  '{image}',
  to_jsonb(replace(card_data->>'image', '.png', '.webp'))
)
WHERE card_data->>'image' LIKE '%.png%';