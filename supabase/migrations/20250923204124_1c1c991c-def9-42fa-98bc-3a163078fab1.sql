-- Исправляем начальные значения баланса и ресурсов на 0
ALTER TABLE public.game_data ALTER COLUMN balance SET DEFAULT 0;

-- Обновляем существующие записи, которые могли быть созданы с неправильными значениями по умолчанию
UPDATE public.game_data 
SET balance = 0, wood = 0, stone = 0, iron = 0, gold = 0 
WHERE balance = 100 AND wood = 0 AND stone = 0 AND iron = 0 AND gold = 0;