-- Drop and recreate admin_insert_crafting_recipe with ON CONFLICT DO UPDATE
DROP FUNCTION IF EXISTS public.admin_insert_crafting_recipe(text, text, integer, text, text, json, integer, integer);

CREATE OR REPLACE FUNCTION public.admin_insert_crafting_recipe(
  p_wallet_address text,
  p_recipe_name text,
  p_result_item_id integer,
  p_category text,
  p_description text,
  p_required_materials json,
  p_result_quantity integer,
  p_crafting_time_hours integer
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_recipe_id text;
BEGIN
  -- Check if user is admin or super admin
  IF NOT public.is_admin_or_super_wallet(p_wallet_address) THEN
    RAISE EXCEPTION 'Access denied: user is not an admin';
  END IF;

  -- Insert with ON CONFLICT DO UPDATE
  INSERT INTO public.crafting_recipes (
    recipe_name,
    result_item_id,
    category,
    description,
    required_materials,
    result_quantity,
    crafting_time_hours,
    created_by_wallet_address,
    created_at,
    updated_at
  ) VALUES (
    p_recipe_name,
    p_result_item_id,
    p_category,
    p_description,
    p_required_materials,
    p_result_quantity,
    p_crafting_time_hours,
    p_wallet_address,
    now(),
    now()
  )
  ON CONFLICT (recipe_name) DO UPDATE SET
    result_item_id = EXCLUDED.result_item_id,
    category = EXCLUDED.category,
    description = EXCLUDED.description,
    required_materials = EXCLUDED.required_materials,
    result_quantity = EXCLUDED.result_quantity,
    crafting_time_hours = EXCLUDED.crafting_time_hours,
    updated_at = now()
  RETURNING id INTO v_recipe_id;
  
  RETURN v_recipe_id;
END;
$function$;