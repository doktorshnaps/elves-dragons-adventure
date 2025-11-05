-- Create RPC function for admin to insert crafting recipes
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
  -- Check admin rights by wallet
  IF NOT public.is_admin_or_super_wallet(p_wallet_address) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Insert new recipe
  INSERT INTO public.crafting_recipes (
    recipe_name,
    result_item_id,
    result_quantity,
    required_materials,
    category,
    description,
    crafting_time_hours,
    created_by_wallet_address,
    is_active
  ) VALUES (
    p_recipe_name,
    p_result_item_id,
    p_result_quantity,
    p_required_materials,
    p_category,
    p_description,
    p_crafting_time_hours,
    p_wallet_address,
    true
  )
  RETURNING id INTO v_recipe_id;

  RETURN v_recipe_id;
END;
$function$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.admin_insert_crafting_recipe TO anon;
GRANT EXECUTE ON FUNCTION public.admin_insert_crafting_recipe TO authenticated;