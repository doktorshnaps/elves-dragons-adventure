-- Fix ambiguous RPC call: keep a single admin_insert_crafting_recipe signature

-- Drop all known variants (some may not exist)
DROP FUNCTION IF EXISTS public.admin_insert_crafting_recipe(text, text, integer, text, text, json, integer, integer);
DROP FUNCTION IF EXISTS public.admin_insert_crafting_recipe(text, text, integer, integer, jsonb, text, text, integer);
DROP FUNCTION IF EXISTS public.admin_insert_crafting_recipe(text, text, integer, integer, json, text, text, integer);
DROP FUNCTION IF EXISTS public.admin_insert_crafting_recipe(text, text, integer, text, text, jsonb, integer, integer);

-- Recreate a single canonical function that matches the table schema (required_materials is jsonb)
CREATE OR REPLACE FUNCTION public.admin_insert_crafting_recipe(
  p_wallet_address text,
  p_recipe_name text,
  p_result_item_id integer,
  p_result_quantity integer,
  p_required_materials jsonb,
  p_category text,
  p_description text,
  p_crafting_time_hours integer
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
    updated_at = now()
  RETURNING id INTO v_recipe_id;

  RETURN v_recipe_id;
END;
$function$;
