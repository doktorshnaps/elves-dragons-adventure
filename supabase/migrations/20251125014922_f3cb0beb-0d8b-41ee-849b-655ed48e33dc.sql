-- Заменяем класс "Маг" на "Чародей" в class_multipliers
UPDATE class_multipliers 
SET class_name = 'Чародей'
WHERE class_name = 'Маг';

-- Обновляем cardClass в card_data для всех card_instances с классом "Маг"
UPDATE card_instances
SET card_data = jsonb_set(
  card_data,
  '{cardClass}',
  '"Чародей"'
)
WHERE card_data->>'cardClass' = 'Маг';

-- Проверяем результат
SELECT class_name, health_multiplier FROM class_multipliers WHERE class_name IN ('Маг', 'Чародей');