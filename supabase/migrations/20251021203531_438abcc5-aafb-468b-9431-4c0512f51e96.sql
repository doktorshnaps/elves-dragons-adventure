-- Функция для обновления только drop_chance в item_templates
CREATE OR REPLACE FUNCTION public.admin_update_item_drop_chance(
  p_item_id integer,
  p_drop_chance numeric,
  p_admin_wallet_address text DEFAULT 'mr_bruts.tg'
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Проверка прав администратора
  IF p_admin_wallet_address != 'mr_bruts.tg' AND NOT is_admin_wallet(p_admin_wallet_address) THEN
    RAISE EXCEPTION 'Unauthorized: Only admin can update item drop chance';
  END IF;

  -- Проверка валидности данных
  IF p_drop_chance < 0 OR p_drop_chance > 100 THEN
    RAISE EXCEPTION 'Drop chance must be between 0 and 100';
  END IF;

  -- Обновление базового шанса дропа
  UPDATE public.item_templates
  SET 
    drop_chance = p_drop_chance,
    updated_at = now()
  WHERE id = p_item_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Item template not found: %', p_item_id;
  END IF;

  RETURN TRUE;
END;
$$;