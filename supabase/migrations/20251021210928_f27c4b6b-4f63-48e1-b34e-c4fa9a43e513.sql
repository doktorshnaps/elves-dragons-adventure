-- Обновляем функцию добавления дропа с поддержкой allowed_monsters
CREATE OR REPLACE FUNCTION public.admin_add_dungeon_item_drop(
  p_item_template_id INTEGER,
  p_dungeon_number INTEGER,
  p_min_dungeon_level INTEGER,
  p_max_dungeon_level INTEGER,
  p_drop_chance NUMERIC,
  p_admin_wallet_address TEXT,
  p_allowed_monsters TEXT[] DEFAULT NULL
)
RETURNS void
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Проверка прав администратора
  IF NOT is_admin_wallet() AND p_admin_wallet_address != 'mr_bruts.tg' THEN
    RAISE EXCEPTION 'Access denied: Only admins can add dungeon item drops';
  END IF;

  -- Добавляем новую настройку дропа
  INSERT INTO dungeon_item_drops (
    item_template_id,
    dungeon_number,
    min_dungeon_level,
    max_dungeon_level,
    drop_chance,
    is_active,
    created_by_wallet_address,
    allowed_monsters
  )
  VALUES (
    p_item_template_id,
    p_dungeon_number,
    p_min_dungeon_level,
    p_max_dungeon_level,
    p_drop_chance,
    true,
    p_admin_wallet_address,
    p_allowed_monsters
  );

  -- Триггер автоматически обновит dungeon_drop_settings в item_templates
END;
$$;

-- Обновляем функцию обновления дропа с поддержкой allowed_monsters
CREATE OR REPLACE FUNCTION public.admin_update_dungeon_item_drop(
  p_drop_id UUID,
  p_min_dungeon_level INTEGER,
  p_max_dungeon_level INTEGER,
  p_drop_chance NUMERIC,
  p_is_active BOOLEAN,
  p_admin_wallet_address TEXT,
  p_allowed_monsters TEXT[] DEFAULT NULL
)
RETURNS void
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Проверка прав администратора
  IF NOT is_admin_wallet() AND p_admin_wallet_address != 'mr_bruts.tg' THEN
    RAISE EXCEPTION 'Access denied: Only admins can update dungeon item drops';
  END IF;

  -- Обновляем настройку дропа
  UPDATE dungeon_item_drops
  SET
    min_dungeon_level = p_min_dungeon_level,
    max_dungeon_level = p_max_dungeon_level,
    drop_chance = p_drop_chance,
    is_active = p_is_active,
    updated_at = now(),
    allowed_monsters = p_allowed_monsters
  WHERE id = p_drop_id;

  -- Триггер автоматически обновит dungeon_drop_settings в item_templates
END;
$$;