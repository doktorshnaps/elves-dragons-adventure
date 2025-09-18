-- Создаем таблицу для хранения информации о предметах
CREATE TABLE public.item_templates (
  id SERIAL PRIMARY KEY,
  item_id text NOT NULL UNIQUE,
  name text NOT NULL,
  type text NOT NULL, -- weapon, armor, accessory, consumable
  rarity text NOT NULL, -- common, rare, epic, legendary
  description text,
  stats jsonb, -- {power: 10, defense: 5, health: 20}
  source_type text NOT NULL, -- monster_drop, craft, quest_reward
  source_details jsonb, -- {monster_id: "skeleton", dungeon_level: 1} или {craft_materials: [...]}
  drop_chance decimal,
  image_url text,
  slot text, -- head, chest, hands, legs, feet, neck, ring1, ring2, weapon, offhand
  level_requirement integer DEFAULT 1,
  value integer DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Создаем индексы для оптимизации запросов
CREATE INDEX idx_item_templates_type ON public.item_templates(type);
CREATE INDEX idx_item_templates_rarity ON public.item_templates(rarity);
CREATE INDEX idx_item_templates_source_type ON public.item_templates(source_type);

-- Включаем RLS
ALTER TABLE public.item_templates ENABLE ROW LEVEL SECURITY;

-- Политика для чтения - все могут просматривать предметы
CREATE POLICY "Anyone can view item templates"
ON public.item_templates
FOR SELECT
USING (true);

-- Политика для вставки - только админы
CREATE POLICY "Only admins can insert item templates"
ON public.item_templates
FOR INSERT
WITH CHECK (is_admin_wallet());

-- Политика для обновления - только админы
CREATE POLICY "Only admins can update item templates"
ON public.item_templates
FOR UPDATE
USING (is_admin_wallet());

-- Политика для удаления - только админы
CREATE POLICY "Only admins can delete item templates"
ON public.item_templates
FOR DELETE
USING (is_admin_wallet());

-- Вставляем примеры предметов
INSERT INTO public.item_templates (item_id, name, type, rarity, description, stats, source_type, source_details, drop_chance, slot, level_requirement, value) VALUES
('sword_iron', 'Железный меч', 'weapon', 'common', 'Простой железный меч для начинающих воинов', '{"power": 5}', 'monster_drop', '{"monster_types": ["skeleton", "goblin"]}', 0.15, 'weapon', 1, 50),
('helmet_leather', 'Кожаный шлем', 'armor', 'common', 'Базовая защита головы из кожи', '{"defense": 3}', 'monster_drop', '{"monster_types": ["wolf", "bandit"]}', 0.12, 'head', 1, 30),
('potion_health_small', 'Малое зелье здоровья', 'consumable', 'common', 'Восстанавливает 50 здоровья', '{"heal": 50}', 'monster_drop', '{"monster_types": ["any"]}', 0.25, null, 1, 25),
('ring_strength', 'Кольцо силы', 'accessory', 'rare', 'Увеличивает силу носителя', '{"power": 8}', 'monster_drop', '{"monster_types": ["orc_chief"], "dungeon_level": 3}', 0.05, 'ring1', 5, 200),
('armor_steel_chest', 'Стальная кираса', 'armor', 'rare', 'Прочная защита торса из стали', '{"defense": 12}', 'craft', '{"materials": [{"item": "steel_ingot", "count": 3}, {"item": "leather", "count": 2}]}', null, 'chest', 8, 300),
('sword_flame', 'Пламенный клинок', 'weapon', 'epic', 'Меч, пропитанный магией огня', '{"power": 25, "fire_damage": 10}', 'monster_drop', '{"monster_types": ["fire_elemental"], "dungeon_level": 10}', 0.02, 'weapon', 15, 1000),
('amulet_wisdom', 'Амулет мудрости', 'accessory', 'legendary', 'Древний артефакт, дарующий великую мудрость', '{"power": 15, "defense": 10, "magic_resistance": 20}', 'quest_reward', '{"quest": "ancient_wisdom"}', null, 'neck', 20, 5000);

-- Создаем функцию для обновления updated_at
CREATE OR REPLACE FUNCTION public.update_item_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Создаем триггер для автоматического обновления updated_at
CREATE TRIGGER update_item_templates_updated_at
    BEFORE UPDATE ON public.item_templates
    FOR EACH ROW
    EXECUTE FUNCTION public.update_item_templates_updated_at();