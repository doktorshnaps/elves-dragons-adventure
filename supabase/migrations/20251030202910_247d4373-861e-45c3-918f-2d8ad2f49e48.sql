-- Таблица для настройки требований улучшения карт
CREATE TABLE IF NOT EXISTS public.card_upgrade_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_type TEXT NOT NULL CHECK (card_type IN ('hero', 'dragon')),
  rarity TEXT NOT NULL CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic')),
  success_chance INTEGER NOT NULL DEFAULT 50 CHECK (success_chance >= 0 AND success_chance <= 100),
  cost_ell INTEGER NOT NULL DEFAULT 0,
  cost_wood INTEGER DEFAULT 0,
  cost_stone INTEGER DEFAULT 0,
  cost_iron INTEGER DEFAULT 0,
  cost_gold INTEGER DEFAULT 0,
  required_items JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by_wallet_address TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  UNIQUE(card_type, rarity)
);

-- Таблица для рецептов крафта  
CREATE TABLE IF NOT EXISTS public.crafting_recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_name TEXT NOT NULL,
  result_item_id INTEGER NOT NULL REFERENCES public.item_templates(id) ON DELETE CASCADE,
  result_quantity INTEGER NOT NULL DEFAULT 1 CHECK (result_quantity > 0),
  required_materials JSONB NOT NULL DEFAULT '[]'::jsonb,
  category TEXT DEFAULT 'general',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by_wallet_address TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  UNIQUE(recipe_name)
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_card_upgrade_requirements_type_rarity ON public.card_upgrade_requirements(card_type, rarity);
CREATE INDEX IF NOT EXISTS idx_card_upgrade_requirements_active ON public.card_upgrade_requirements(is_active);
CREATE INDEX IF NOT EXISTS idx_crafting_recipes_active ON public.crafting_recipes(is_active);
CREATE INDEX IF NOT EXISTS idx_crafting_recipes_result ON public.crafting_recipes(result_item_id);

-- Триггер для обновления updated_at
CREATE OR REPLACE FUNCTION update_card_upgrade_requirements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER card_upgrade_requirements_updated_at
  BEFORE UPDATE ON public.card_upgrade_requirements
  FOR EACH ROW
  EXECUTE FUNCTION update_card_upgrade_requirements_updated_at();

CREATE TRIGGER crafting_recipes_updated_at
  BEFORE UPDATE ON public.crafting_recipes
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- RLS политики для card_upgrade_requirements
ALTER TABLE public.card_upgrade_requirements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active upgrade requirements"
  ON public.card_upgrade_requirements FOR SELECT
  USING (is_active = true);

CREATE POLICY "Only admins can insert upgrade requirements"
  ON public.card_upgrade_requirements FOR INSERT
  WITH CHECK (is_admin_or_super_wallet(get_current_user_wallet()));

CREATE POLICY "Only admins can update upgrade requirements"
  ON public.card_upgrade_requirements FOR UPDATE
  USING (is_admin_or_super_wallet(get_current_user_wallet()));

CREATE POLICY "Only admins can delete upgrade requirements"
  ON public.card_upgrade_requirements FOR DELETE
  USING (is_admin_or_super_wallet(get_current_user_wallet()));

-- RLS политики для crafting_recipes
ALTER TABLE public.crafting_recipes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active crafting recipes"
  ON public.crafting_recipes FOR SELECT
  USING (is_active = true);

CREATE POLICY "Only admins can insert crafting recipes"
  ON public.crafting_recipes FOR INSERT
  WITH CHECK (is_admin_or_super_wallet(get_current_user_wallet()));

CREATE POLICY "Only admins can update crafting recipes"
  ON public.crafting_recipes FOR UPDATE
  USING (is_admin_or_super_wallet(get_current_user_wallet()));

CREATE POLICY "Only admins can delete crafting recipes"
  ON public.crafting_recipes FOR DELETE
  USING (is_admin_or_super_wallet(get_current_user_wallet()));

-- Вставляем начальные данные для улучшений героев
INSERT INTO public.card_upgrade_requirements (card_type, rarity, success_chance, cost_ell, cost_wood, cost_stone, cost_iron, required_items, created_by_wallet_address) VALUES
('hero', 'common', 90, 100, 50, 0, 0, '[]'::jsonb, 'mr_bruts.tg'),
('hero', 'uncommon', 80, 300, 100, 50, 0, '[]'::jsonb, 'mr_bruts.tg'),
('hero', 'rare', 70, 600, 200, 100, 50, '[]'::jsonb, 'mr_bruts.tg'),
('hero', 'epic', 60, 1200, 300, 200, 100, '[]'::jsonb, 'mr_bruts.tg'),
('hero', 'legendary', 50, 2500, 0, 400, 200, '[]'::jsonb, 'mr_bruts.tg'),
('hero', 'mythic', 40, 5000, 0, 0, 400, '[]'::jsonb, 'mr_bruts.tg');

-- Вставляем начальные данные для улучшений драконов
INSERT INTO public.card_upgrade_requirements (card_type, rarity, success_chance, cost_ell, cost_wood, cost_stone, cost_iron, required_items, created_by_wallet_address) VALUES
('dragon', 'common', 85, 150, 80, 0, 0, '[]'::jsonb, 'mr_bruts.tg'),
('dragon', 'uncommon', 75, 400, 150, 80, 0, '[]'::jsonb, 'mr_bruts.tg'),
('dragon', 'rare', 65, 800, 250, 150, 80, '[]'::jsonb, 'mr_bruts.tg'),
('dragon', 'epic', 55, 1500, 400, 250, 150, '[]'::jsonb, 'mr_bruts.tg'),
('dragon', 'legendary', 45, 3000, 0, 500, 300, '[]'::jsonb, 'mr_bruts.tg'),
('dragon', 'mythic', 35, 6000, 0, 0, 500, '[]'::jsonb, 'mr_bruts.tg');