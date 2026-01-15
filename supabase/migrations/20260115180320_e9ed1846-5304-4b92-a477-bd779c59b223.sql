-- Add required building columns to crafting_recipes table
ALTER TABLE public.crafting_recipes 
ADD COLUMN IF NOT EXISTS required_building_id text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS required_building_level integer DEFAULT 0;

COMMENT ON COLUMN public.crafting_recipes.required_building_id IS 'Building ID required to unlock this recipe (e.g., workshop, forge)';
COMMENT ON COLUMN public.crafting_recipes.required_building_level IS 'Minimum building level required to craft this recipe';

-- Add required building columns to card_upgrade_requirements table
ALTER TABLE public.card_upgrade_requirements 
ADD COLUMN IF NOT EXISTS required_building_id text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS required_building_level integer DEFAULT 0;

COMMENT ON COLUMN public.card_upgrade_requirements.required_building_id IS 'Building ID required to unlock this upgrade';
COMMENT ON COLUMN public.card_upgrade_requirements.required_building_level IS 'Minimum building level required for this upgrade';

-- Update the admin_insert_crafting_recipe function to include building requirements
DROP FUNCTION IF EXISTS public.admin_insert_crafting_recipe(text, text, integer, integer, jsonb, text, text, integer);

CREATE OR REPLACE FUNCTION public.admin_insert_crafting_recipe(
  p_wallet_address text,
  p_recipe_name text,
  p_result_item_id integer,
  p_result_quantity integer,
  p_required_materials jsonb,
  p_category text,
  p_description text,
  p_crafting_time_hours integer,
  p_required_building_id text DEFAULT NULL,
  p_required_building_level integer DEFAULT 0
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_recipe_id uuid;
BEGIN
  -- Check if user is admin or super admin
  IF NOT public.is_admin_or_super_wallet(p_wallet_address) THEN
    RAISE EXCEPTION 'Access denied: user is not an admin';
  END IF;

  INSERT INTO public.crafting_recipes (
    recipe_name,
    result_item_id,
    result_quantity,
    required_materials,
    category,
    description,
    crafting_time_hours,
    required_building_id,
    required_building_level,
    created_by_wallet_address,
    created_at,
    updated_at
  ) VALUES (
    p_recipe_name,
    p_result_item_id,
    p_result_quantity,
    p_required_materials,
    p_category,
    p_description,
    p_crafting_time_hours,
    p_required_building_id,
    p_required_building_level,
    p_wallet_address,
    now(),
    now()
  )
  ON CONFLICT (recipe_name) DO UPDATE SET
    result_item_id = EXCLUDED.result_item_id,
    result_quantity = EXCLUDED.result_quantity,
    required_materials = EXCLUDED.required_materials,
    category = EXCLUDED.category,
    description = EXCLUDED.description,
    crafting_time_hours = EXCLUDED.crafting_time_hours,
    required_building_id = EXCLUDED.required_building_id,
    required_building_level = EXCLUDED.required_building_level,
    updated_at = now()
  RETURNING id INTO v_recipe_id;

  RETURN v_recipe_id;
END;
$function$;

-- Update the admin_update_crafting_recipe function to include building requirements
DROP FUNCTION IF EXISTS public.admin_update_crafting_recipe(uuid, text, text, integer, integer, jsonb, text, text, integer);
DROP FUNCTION IF EXISTS public.admin_update_crafting_recipe(uuid, text, text, integer, integer, json, text, text, integer);

CREATE OR REPLACE FUNCTION public.admin_update_crafting_recipe(
  p_recipe_id uuid,
  p_wallet_address text,
  p_recipe_name text,
  p_result_item_id integer,
  p_result_quantity integer,
  p_required_materials jsonb,
  p_category text,
  p_description text,
  p_crafting_time_hours integer,
  p_required_building_id text DEFAULT NULL,
  p_required_building_level integer DEFAULT 0
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Check if user is admin or super admin
  IF NOT public.is_admin_or_super_wallet(p_wallet_address) THEN
    RAISE EXCEPTION 'Access denied: user is not an admin';
  END IF;

  UPDATE public.crafting_recipes SET
    recipe_name = p_recipe_name,
    result_item_id = p_result_item_id,
    result_quantity = p_result_quantity,
    required_materials = p_required_materials,
    category = p_category,
    description = p_description,
    crafting_time_hours = p_crafting_time_hours,
    required_building_id = p_required_building_id,
    required_building_level = p_required_building_level,
    updated_at = now()
  WHERE id = p_recipe_id;
END;
$function$;