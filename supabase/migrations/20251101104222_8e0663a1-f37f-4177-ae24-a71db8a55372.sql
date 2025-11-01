-- Create monsters table for dungeon monster configuration
CREATE TABLE IF NOT EXISTS public.monsters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  monster_id text NOT NULL UNIQUE,
  monster_name text NOT NULL,
  monster_type text NOT NULL DEFAULT 'normal', -- normal, miniboss, boss
  description text,
  image_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_by_wallet_address text NOT NULL DEFAULT 'mr_bruts.tg',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_monsters_type ON public.monsters(monster_type);
CREATE INDEX idx_monsters_active ON public.monsters(is_active);

-- Enable RLS
ALTER TABLE public.monsters ENABLE ROW LEVEL SECURITY;

-- Anyone can view active monsters
CREATE POLICY "Anyone can view active monsters"
  ON public.monsters
  FOR SELECT
  USING (is_active = true);

-- Only admins can insert monsters
CREATE POLICY "Only admins can insert monsters"
  ON public.monsters
  FOR INSERT
  WITH CHECK (is_admin_wallet());

-- Only admins can update monsters
CREATE POLICY "Only admins can update monsters"
  ON public.monsters
  FOR UPDATE
  USING (is_admin_wallet());

-- Only admins can delete monsters
CREATE POLICY "Only admins can delete monsters"
  ON public.monsters
  FOR DELETE
  USING (is_admin_wallet());

-- Insert some default monsters
INSERT INTO public.monsters (monster_id, monster_name, monster_type, description) VALUES
  ('goblin', 'Гоблин', 'normal', 'Слабый враг для начальных уровней'),
  ('orc', 'Орк', 'normal', 'Средний враг'),
  ('troll', 'Тролль', 'normal', 'Сильный враг'),
  ('skeleton', 'Скелет', 'normal', 'Нежить'),
  ('zombie', 'Зомби', 'normal', 'Медленная нежить'),
  ('spider', 'Паук', 'normal', 'Быстрый враг'),
  ('wolf', 'Волк', 'normal', 'Быстрый хищник'),
  ('bear', 'Медведь', 'normal', 'Сильный хищник'),
  ('ogre', 'Огр', 'miniboss', 'Минибосс'),
  ('demon', 'Демон', 'miniboss', 'Сильный минибосс'),
  ('dragon_miniboss', 'Дракон (мини)', 'miniboss', 'Драконий минибосс'),
  ('ancient_dragon', 'Древний дракон', 'boss', 'Финальный босс'),
  ('demon_lord', 'Повелитель демонов', 'boss', 'Финальный босс')
ON CONFLICT (monster_id) DO NOTHING;