-- Добавляем новые поля для раздельного роста статов монстров
ALTER TABLE public.dungeon_settings
ADD COLUMN IF NOT EXISTS hp_growth numeric NOT NULL DEFAULT 1.15,
ADD COLUMN IF NOT EXISTS armor_growth numeric NOT NULL DEFAULT 1.10,
ADD COLUMN IF NOT EXISTS atk_growth numeric NOT NULL DEFAULT 1.12;

-- Обновляем существующие записи значениями по умолчанию из эмулятора
UPDATE public.dungeon_settings
SET 
  hp_growth = 1.15,
  armor_growth = 1.10,
  atk_growth = 1.12
WHERE hp_growth IS NULL OR armor_growth IS NULL OR atk_growth IS NULL;

-- Комментарии для документации
COMMENT ON COLUMN public.dungeon_settings.hp_growth IS 'Коэффициент роста HP монстров по уровням (формула: baseHP × hpGrowth^((L-1)/10))';
COMMENT ON COLUMN public.dungeon_settings.armor_growth IS 'Коэффициент роста Armor монстров по уровням (формула: baseArmor × armorGrowth^((L-1)/10))';
COMMENT ON COLUMN public.dungeon_settings.atk_growth IS 'Коэффициент роста ATK монстров по уровням (формула: baseATK × atkGrowth^((L-1)/10))';