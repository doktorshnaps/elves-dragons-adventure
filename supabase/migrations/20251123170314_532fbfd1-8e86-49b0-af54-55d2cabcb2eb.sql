-- ФАЗА 1: Оптимизация статичных данных
-- Сокращение 5 HTTP запросов → 1 запрос с агрессивным кешированием

-- 1. Создать RPC функцию для получения всех статичных данных
CREATE OR REPLACE FUNCTION public.get_static_game_data()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN jsonb_build_object(
    'building_configs', (
      SELECT COALESCE(jsonb_agg(row_to_json(bc)), '[]'::jsonb)
      FROM building_configs bc
      WHERE bc.is_active = true
      ORDER BY bc.building_id, bc.level
    ),
    'crafting_recipes', (
      SELECT COALESCE(jsonb_agg(row_to_json(cr)), '[]'::jsonb)
      FROM crafting_recipes cr
      WHERE cr.is_active = true
      ORDER BY cr.category, cr.recipe_name
    ),
    'item_templates', (
      SELECT COALESCE(jsonb_agg(row_to_json(it)), '[]'::jsonb)
      FROM item_templates it
      ORDER BY it.type, it.name
    ),
    'card_drop_rates', (
      SELECT COALESCE(jsonb_agg(row_to_json(cdr)), '[]'::jsonb)
      FROM card_class_drop_rates cdr
      ORDER BY cdr.card_type, cdr.display_order
    ),
    'card_upgrade_requirements', (
      SELECT COALESCE(jsonb_agg(row_to_json(cur)), '[]'::jsonb)
      FROM card_upgrade_requirements cur
      WHERE cur.is_active = true
      ORDER BY cur.card_type, cur.from_rarity
    )
  );
END;
$$;

-- 2. Создать индексы для ускорения RPC функции
CREATE INDEX IF NOT EXISTS idx_building_configs_building_level 
ON building_configs(building_id, level) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_crafting_recipes_active 
ON crafting_recipes(is_active, category) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_card_upgrade_req_type_rarity 
ON card_upgrade_requirements(card_type, from_rarity, to_rarity) WHERE is_active = true;