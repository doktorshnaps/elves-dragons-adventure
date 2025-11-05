-- Функция для безопасного обновления рецептов крафта
CREATE OR REPLACE FUNCTION admin_update_crafting_recipe(
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
SET search_path TO 'public'
AS $$
BEGIN
  -- Проверяем, является ли пользователь администратором
  IF NOT public.is_admin_or_super_wallet(p_wallet_address) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Обновляем рецепт
  UPDATE crafting_recipes
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
END;
$$;