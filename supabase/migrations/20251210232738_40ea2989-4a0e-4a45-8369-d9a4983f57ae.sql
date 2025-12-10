-- Update get_static_game_data to include faction_elements
CREATE OR REPLACE FUNCTION public.get_static_game_data()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'building_configs', COALESCE((SELECT jsonb_agg(to_jsonb(bc)) FROM building_configs bc WHERE bc.is_active = true), '[]'::jsonb),
    'crafting_recipes', COALESCE((SELECT jsonb_agg(to_jsonb(cr)) FROM crafting_recipes cr WHERE cr.is_active = true), '[]'::jsonb),
    'item_templates', COALESCE((SELECT jsonb_agg(to_jsonb(it)) FROM item_templates it), '[]'::jsonb),
    'card_drop_rates', COALESCE((SELECT jsonb_agg(to_jsonb(cdr)) FROM card_class_drop_rates cdr), '[]'::jsonb),
    'card_upgrade_requirements', COALESCE((SELECT jsonb_agg(to_jsonb(cur)) FROM card_upgrade_requirements cur WHERE cur.is_active = true), '[]'::jsonb),
    'monsters', COALESCE((SELECT jsonb_agg(to_jsonb(m)) FROM monsters m WHERE m.is_active = true), '[]'::jsonb),
    'dungeon_settings', COALESCE((SELECT jsonb_agg(to_jsonb(ds)) FROM dungeon_settings ds), '[]'::jsonb),
    'faction_elements', COALESCE((SELECT jsonb_agg(to_jsonb(fe)) FROM faction_elements fe), '[]'::jsonb)
  ) INTO result;
  
  RETURN result;
END;
$$;