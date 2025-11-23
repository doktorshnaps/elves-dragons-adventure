-- Обновляем get_static_game_data() для включения monsters и dungeon_settings
CREATE OR REPLACE FUNCTION public.get_static_game_data()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN jsonb_build_object(
    'building_configs', (
      SELECT COALESCE(jsonb_agg(row_to_json(bc)), '[]'::jsonb)
      FROM building_configs bc
      WHERE bc.is_active = true
    ),
    'crafting_recipes', (
      SELECT COALESCE(jsonb_agg(row_to_json(cr)), '[]'::jsonb)
      FROM crafting_recipes cr
      WHERE cr.is_active = true
    ),
    'item_templates', (
      SELECT COALESCE(jsonb_agg(row_to_json(it)), '[]'::jsonb)
      FROM item_templates it
    ),
    'card_drop_rates', (
      SELECT COALESCE(jsonb_agg(row_to_json(cdr)), '[]'::jsonb)
      FROM card_class_drop_rates cdr
    ),
    'card_upgrade_requirements', (
      SELECT COALESCE(jsonb_agg(row_to_json(cur)), '[]'::jsonb)
      FROM card_upgrade_requirements cur
      WHERE cur.is_active = true
    ),
    'monsters', (
      SELECT COALESCE(jsonb_agg(row_to_json(m)), '[]'::jsonb)
      FROM monsters m
      WHERE m.is_active = true
    ),
    'dungeon_settings', (
      SELECT COALESCE(jsonb_agg(row_to_json(ds)), '[]'::jsonb)
      FROM dungeon_settings ds
    )
  );
END;
$$;