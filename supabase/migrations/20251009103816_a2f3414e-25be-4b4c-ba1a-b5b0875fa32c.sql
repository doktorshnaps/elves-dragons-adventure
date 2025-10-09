-- Изменяем значение по умолчанию для скорости лечения в medical_bay на 100 HP/мин
ALTER TABLE medical_bay 
ALTER COLUMN heal_rate SET DEFAULT 100;

-- Обновляем существующие записи
UPDATE medical_bay 
SET heal_rate = 100 
WHERE heal_rate < 100;