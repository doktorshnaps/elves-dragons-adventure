-- Обновляем настройки для spider_nest (D1) с новыми параметрами роста
UPDATE public.dungeon_settings
SET 
  base_hp = 140,
  base_armor = 60,
  base_atk = 30,
  hp_growth = 1.10,
  armor_growth = 1.10,
  atk_growth = 1.12,
  updated_at = now()
WHERE dungeon_type = 'spider_nest';