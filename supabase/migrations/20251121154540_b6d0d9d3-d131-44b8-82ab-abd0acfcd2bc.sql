-- Update admin_update_building_config to handle required_buildings
CREATE OR REPLACE FUNCTION public.admin_update_building_config(
  p_id uuid,
  p_update jsonb,
  p_wallet_address text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wallet text;
BEGIN
  -- Get wallet from parameter or from auth
  v_wallet := COALESCE(p_wallet_address, public.get_current_user_wallet());
  
  IF NOT public.is_admin_or_super_wallet(v_wallet) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  UPDATE public.building_configs
  SET
    production_per_hour = COALESCE((p_update->>'production_per_hour')::int, production_per_hour),
    cost_wood = COALESCE((p_update->>'cost_wood')::int, cost_wood),
    cost_stone = COALESCE((p_update->>'cost_stone')::int, cost_stone),
    cost_iron = COALESCE((p_update->>'cost_iron')::int, cost_iron),
    cost_gold = COALESCE((p_update->>'cost_gold')::int, cost_gold),
    cost_ell = COALESCE((p_update->>'cost_ell')::int, cost_ell),
    cost_gt = COALESCE((p_update->>'cost_gt')::numeric, cost_gt),
    required_items = COALESCE(p_update->'required_items', required_items),
    required_buildings = COALESCE(p_update->'required_buildings', required_buildings),
    required_main_hall_level = COALESCE((p_update->>'required_main_hall_level')::int, required_main_hall_level),
    upgrade_time_hours = COALESCE((p_update->>'upgrade_time_hours')::numeric, upgrade_time_hours),
    storage_capacity = COALESCE((p_update->>'storage_capacity')::int, storage_capacity),
    working_hours = COALESCE((p_update->>'working_hours')::int, working_hours),
    updated_at = now()
  WHERE id = p_id;

  RETURN found;
END;
$$;

-- Update admin_insert_building_config to handle required_buildings
CREATE OR REPLACE FUNCTION public.admin_insert_building_config(
  p_data jsonb,
  p_wallet_address text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
  v_wallet text;
BEGIN
  -- Get wallet from parameter or from auth
  v_wallet := COALESCE(p_wallet_address, public.get_current_user_wallet());
  
  IF NOT public.is_admin_or_super_wallet(v_wallet) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  INSERT INTO public.building_configs (
    building_id,
    building_name,
    level,
    production_per_hour,
    cost_wood,
    cost_stone,
    cost_iron,
    cost_gold,
    cost_ell,
    cost_gt,
    required_items,
    required_buildings,
    required_main_hall_level,
    upgrade_time_hours,
    storage_capacity,
    working_hours,
    is_active,
    created_by_wallet_address
  ) VALUES (
    p_data->>'building_id',
    p_data->>'building_name',
    COALESCE((p_data->>'level')::int, 1),
    COALESCE((p_data->>'production_per_hour')::int, 0),
    COALESCE((p_data->>'cost_wood')::int, 0),
    COALESCE((p_data->>'cost_stone')::int, 0),
    COALESCE((p_data->>'cost_iron')::int, 0),
    COALESCE((p_data->>'cost_gold')::int, 0),
    COALESCE((p_data->>'cost_ell')::int, 0),
    COALESCE((p_data->>'cost_gt')::numeric, 0),
    COALESCE(p_data->'required_items', '[]'::jsonb),
    COALESCE(p_data->'required_buildings', '[]'::jsonb),
    COALESCE((p_data->>'required_main_hall_level')::int, 0),
    COALESCE((p_data->>'upgrade_time_hours')::numeric, 1),
    COALESCE((p_data->>'storage_capacity')::int, 0),
    COALESCE((p_data->>'working_hours')::int, 0),
    COALESCE((p_data->>'is_active')::boolean, true),
    v_wallet
  ) RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;