-- Удаляем старые данные классов героев
DELETE FROM public.class_multipliers;

-- Вставляем правильные классы героев
INSERT INTO public.class_multipliers (class_name, health_multiplier, defense_multiplier, power_multiplier, magic_multiplier) VALUES
('Рекрут', 1.0, 1.0, 1.0, 1.0),
('Страж', 1.2, 1.3, 1.1, 0.8),
('Ветеран', 1.3, 1.2, 1.2, 0.9),
('Маг', 0.8, 0.7, 0.9, 1.5),
('Мастер', 1.1, 1.1, 1.3, 1.0),
('Целитель', 0.9, 0.8, 0.7, 1.4),
('Защитник', 1.4, 1.5, 1.0, 0.7),
('Ветеран Защитник', 1.5, 1.6, 1.1, 0.7),
('Стратег', 1.0, 1.0, 1.1, 1.2),
('Верховный Стратег', 1.2, 1.2, 1.3, 1.3)
ON CONFLICT (class_name) DO UPDATE SET
  health_multiplier = EXCLUDED.health_multiplier,
  defense_multiplier = EXCLUDED.defense_multiplier,
  power_multiplier = EXCLUDED.power_multiplier,
  magic_multiplier = EXCLUDED.magic_multiplier;