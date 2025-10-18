-- Удаляем неправильную запись
DELETE FROM public.card_class_mappings WHERE card_name = 'Верховный Стратег' AND class_name = 'Стратег';

-- Добавляем правильные маппинги для класса Стратег
INSERT INTO public.card_class_mappings (card_name, card_type, class_name)
VALUES 
  ('Стратег', 'hero', 'Стратег'),
  ('Strategist', 'hero', 'Стратег')
ON CONFLICT (card_name, card_type) DO UPDATE SET class_name = EXCLUDED.class_name;

-- Добавляем правильные маппинги для класса Верховный Стратег
INSERT INTO public.card_class_mappings (card_name, card_type, class_name)
VALUES 
  ('Верховный Стратег', 'hero', 'Верховный Стратег'),
  ('Supreme Strategist', 'hero', 'Верховный Стратег')
ON CONFLICT (card_name, card_type) DO UPDATE SET class_name = EXCLUDED.class_name;