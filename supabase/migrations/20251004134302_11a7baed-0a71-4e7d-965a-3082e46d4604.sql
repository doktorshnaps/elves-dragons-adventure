-- Таблица для базовых настроек героев
CREATE TABLE IF NOT EXISTS public.hero_base_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  health integer NOT NULL DEFAULT 100,
  defense integer NOT NULL DEFAULT 25,
  power integer NOT NULL DEFAULT 20,
  magic integer NOT NULL DEFAULT 15,
  updated_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

-- Таблица для базовых настроек драконов
CREATE TABLE IF NOT EXISTS public.dragon_base_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  health integer NOT NULL DEFAULT 80,
  defense integer NOT NULL DEFAULT 20,
  power integer NOT NULL DEFAULT 25,
  magic integer NOT NULL DEFAULT 30,
  updated_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

-- Таблица множителей по редкости
CREATE TABLE IF NOT EXISTS public.rarity_multipliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rarity integer NOT NULL CHECK (rarity >= 1 AND rarity <= 8),
  multiplier numeric NOT NULL DEFAULT 1.0,
  updated_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(rarity)
);

-- Таблица множителей по классам героев
CREATE TABLE IF NOT EXISTS public.class_multipliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_name text NOT NULL,
  health_multiplier numeric NOT NULL DEFAULT 1.0,
  defense_multiplier numeric NOT NULL DEFAULT 1.0,
  power_multiplier numeric NOT NULL DEFAULT 1.0,
  magic_multiplier numeric NOT NULL DEFAULT 1.0,
  updated_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(class_name)
);

-- Таблица множителей по классам драконов
CREATE TABLE IF NOT EXISTS public.dragon_class_multipliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_name text NOT NULL,
  health_multiplier numeric NOT NULL DEFAULT 1.0,
  defense_multiplier numeric NOT NULL DEFAULT 1.0,
  power_multiplier numeric NOT NULL DEFAULT 1.0,
  magic_multiplier numeric NOT NULL DEFAULT 1.0,
  updated_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(class_name)
);

-- Таблица настроек подземелий
CREATE TABLE IF NOT EXISTS public.dungeon_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dungeon_type text NOT NULL UNIQUE,
  dungeon_name text NOT NULL,
  dungeon_number integer NOT NULL,
  
  -- Базовые характеристики монстров
  base_hp integer NOT NULL DEFAULT 100,
  base_armor integer NOT NULL DEFAULT 18,
  base_atk integer NOT NULL DEFAULT 18,
  
  -- Коэффициенты роста
  hp_growth_coefficient numeric NOT NULL DEFAULT 0.7,
  armor_growth_coefficient numeric NOT NULL DEFAULT 0.18,
  atk_growth_coefficient numeric NOT NULL DEFAULT 0.18,
  
  -- Параметры формулы S_mob
  s_mob_base numeric NOT NULL DEFAULT 100,
  dungeon_alpha numeric NOT NULL DEFAULT 1.0,
  level_beta numeric NOT NULL DEFAULT 1.0,
  level_g_coefficient numeric NOT NULL DEFAULT 0.045,
  
  updated_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

-- Вставляем начальные данные для базовых статов
INSERT INTO public.hero_base_stats (health, defense, power, magic)
VALUES (100, 25, 20, 15)
ON CONFLICT DO NOTHING;

INSERT INTO public.dragon_base_stats (health, defense, power, magic)
VALUES (80, 20, 25, 30)
ON CONFLICT DO NOTHING;

-- Вставляем множители по редкости (R1-R8)
INSERT INTO public.rarity_multipliers (rarity, multiplier) VALUES
(1, 1.0),
(2, 1.5),
(3, 2.0),
(4, 3.0),
(5, 4.5),
(6, 6.0),
(7, 8.0),
(8, 10.0)
ON CONFLICT (rarity) DO NOTHING;

-- Вставляем настройки подземелий
INSERT INTO public.dungeon_settings (
  dungeon_type, dungeon_name, dungeon_number,
  base_hp, base_armor, base_atk,
  hp_growth_coefficient, armor_growth_coefficient, atk_growth_coefficient,
  s_mob_base, dungeon_alpha, level_beta, level_g_coefficient
) VALUES
('forgotten_souls', 'Забытые души', 1, 100, 18, 18, 0.7, 0.18, 0.18, 100, 1.0, 1.0, 0.045),
('spider_nest', 'Паучье гнездо', 2, 100, 18, 18, 0.7, 0.18, 0.18, 100, 1.0, 1.0, 0.045),
('bone_dungeon', 'Костяное подземелье', 3, 100, 18, 18, 0.7, 0.18, 0.18, 100, 1.0, 1.0, 0.045),
('dragon_lair', 'Логово дракона', 4, 100, 18, 18, 0.7, 0.18, 0.18, 100, 1.0, 1.0, 0.045),
('dark_mage', 'Темный маг', 5, 100, 18, 18, 0.7, 0.18, 0.18, 100, 1.0, 1.0, 0.045),
('sea_serpent', 'Морской змей', 6, 100, 18, 18, 0.7, 0.18, 0.18, 100, 1.0, 1.0, 0.045),
('ice_throne', 'Ледяной трон', 7, 100, 18, 18, 0.7, 0.18, 0.18, 100, 1.0, 1.0, 0.045),
('pantheon_gods', 'Пантеон богов', 8, 100, 18, 18, 0.7, 0.18, 0.18, 100, 1.0, 1.0, 0.045)
ON CONFLICT (dungeon_type) DO NOTHING;

-- Вставляем множители классов героев (из cardUtils.ts)
INSERT INTO public.class_multipliers (class_name, health_multiplier, defense_multiplier, power_multiplier, magic_multiplier) VALUES
('Воин', 1.2, 1.3, 1.1, 0.7),
('Маг', 0.8, 0.7, 0.9, 1.5),
('Лучник', 0.9, 0.9, 1.2, 0.8),
('Паладин', 1.3, 1.4, 1.0, 1.0),
('Друид', 1.0, 1.0, 0.8, 1.3),
('Жрец', 0.9, 0.8, 0.7, 1.4),
('Рыцарь', 1.4, 1.5, 1.1, 0.6)
ON CONFLICT (class_name) DO NOTHING;

-- Вставляем множители классов драконов
INSERT INTO public.dragon_class_multipliers (class_name, health_multiplier, defense_multiplier, power_multiplier, magic_multiplier) VALUES
('Огненный', 1.0, 0.9, 1.3, 1.2),
('Ледяной', 0.9, 1.1, 1.0, 1.3),
('Лесной', 1.1, 1.0, 0.9, 1.2),
('Теневой', 0.8, 0.8, 1.2, 1.5),
('Водный', 1.0, 1.2, 0.9, 1.1),
('Песчаный', 1.1, 1.3, 1.0, 0.9),
('Небесный', 0.9, 0.9, 1.1, 1.4)
ON CONFLICT (class_name) DO NOTHING;

-- RLS политики
ALTER TABLE public.hero_base_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dragon_base_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rarity_multipliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_multipliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dragon_class_multipliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dungeon_settings ENABLE ROW LEVEL SECURITY;

-- Все могут читать настройки
CREATE POLICY "Anyone can view hero base stats" ON public.hero_base_stats FOR SELECT USING (true);
CREATE POLICY "Anyone can view dragon base stats" ON public.dragon_base_stats FOR SELECT USING (true);
CREATE POLICY "Anyone can view rarity multipliers" ON public.rarity_multipliers FOR SELECT USING (true);
CREATE POLICY "Anyone can view class multipliers" ON public.class_multipliers FOR SELECT USING (true);
CREATE POLICY "Anyone can view dragon class multipliers" ON public.dragon_class_multipliers FOR SELECT USING (true);
CREATE POLICY "Anyone can view dungeon settings" ON public.dungeon_settings FOR SELECT USING (true);

-- Только админы могут изменять
CREATE POLICY "Only admins can update hero base stats" ON public.hero_base_stats FOR UPDATE USING (is_admin_wallet());
CREATE POLICY "Only admins can update dragon base stats" ON public.dragon_base_stats FOR UPDATE USING (is_admin_wallet());
CREATE POLICY "Only admins can update rarity multipliers" ON public.rarity_multipliers FOR UPDATE USING (is_admin_wallet());
CREATE POLICY "Only admins can update class multipliers" ON public.class_multipliers FOR UPDATE USING (is_admin_wallet());
CREATE POLICY "Only admins can update dragon class multipliers" ON public.dragon_class_multipliers FOR UPDATE USING (is_admin_wallet());
CREATE POLICY "Only admins can update dungeon settings" ON public.dungeon_settings FOR UPDATE USING (is_admin_wallet());

CREATE POLICY "Only admins can insert class multipliers" ON public.class_multipliers FOR INSERT WITH CHECK (is_admin_wallet());
CREATE POLICY "Only admins can insert dragon class multipliers" ON public.dragon_class_multipliers FOR INSERT WITH CHECK (is_admin_wallet());