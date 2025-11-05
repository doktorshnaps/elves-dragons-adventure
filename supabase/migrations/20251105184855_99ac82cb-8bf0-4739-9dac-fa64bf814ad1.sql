-- Ensure admin RPCs for crafting recipes exist and are callable by the web app
-- 1) Create/replace secure UPDATE function with proper grants and error handling
CREATE OR REPLACE FUNCTION public.admin_update_crafting_recipe(
  p_recipe_id UUID,
  p_wallet_address TEXT,
  p_recipe_name TEXT,
  p_result_item_id INTEGER,
  p_result_quantity INTEGER,
  p_required_materials JSONB,
  p_category TEXT,
  p_description TEXT,
  p_crafting_time_hours INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  -- Check admin rights by wallet
  IF NOT public.is_admin_or_super_wallet(p_wallet_address) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Perform update
  UPDATE public.crafting_recipes
  SET 
    recipe_name = p_recipe_name,
    result_item_id = p_result_item_id,
    result_quantity = p_result_quantity,
    required_materials = p_required_materials,
    category = p_category,
    description = p_description,
    crafting_time_hours = p_crafting_time_hours,
    updated_at = NOW()
  WHERE id = p_recipe_id;

  -- If nothing updated, report a clear error
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Recipe not found';
  END IF;
END;
$$;

-- Allow calls from anon/authenticated (secured by SECURITY DEFINER + internal admin check)
GRANT EXECUTE ON FUNCTION public.admin_update_crafting_recipe(
  uuid, text, text, integer, integer, jsonb, text, text, integer
) TO anon, authenticated;

-- 2) Harden existing DELETE function: ensure it errors when nothing is deleted and grant execute
CREATE OR REPLACE FUNCTION public.admin_delete_crafting_recipe(
  p_id uuid,
  p_wallet text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin_or_super_wallet(p_wallet) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  DELETE FROM public.crafting_recipes WHERE id = p_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Recipe not found';
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_delete_crafting_recipe(uuid, text) TO anon, authenticated;