-- Drop the old function with RETURNS void
DROP FUNCTION IF EXISTS public.admin_add_dungeon_item_drop(integer, integer, integer, integer, numeric, text, text[]);

-- Create updated function with RETURNS uuid and ON CONFLICT handling
CREATE OR REPLACE FUNCTION public.admin_add_dungeon_item_drop(
  p_item_template_id integer, 
  p_dungeon_number integer, 
  p_min_dungeon_level integer, 
  p_max_dungeon_level integer, 
  p_drop_chance numeric, 
  p_admin_wallet_address text, 
  p_allowed_monsters text[] DEFAULT NULL::text[]
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_drop_id UUID;
BEGIN
  -- Проверка прав администратора
  IF NOT is_admin_wallet() AND p_admin_wallet_address != 'mr_bruts.tg' THEN
    RAISE EXCEPTION 'Access denied: Only admins can add dungeon item drops';
  END IF;

  -- Проверка валидности данных
  IF p_drop_chance < 0 OR p_drop_chance > 100 THEN
    RAISE EXCEPTION 'Drop chance must be between 0 and 100';
  END IF;

  IF p_min_dungeon_level < 1 THEN
    RAISE EXCEPTION 'Minimum dungeon level must be at least 1';
  END IF;

  IF p_max_dungeon_level IS NOT NULL AND p_max_dungeon_level < p_min_dungeon_level THEN
    RAISE EXCEPTION 'Maximum dungeon level must be greater than or equal to minimum level';
  END IF;

  -- Вставка новой настройки дропа с ON CONFLICT для обновления существующих
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
  )
  ON CONFLICT (item_template_id, dungeon_number, min_dungeon_level)
  DO UPDATE SET
    max_dungeon_level = EXCLUDED.max_dungeon_level,
    drop_chance = EXCLUDED.drop_chance,
    is_active = true,
    allowed_monsters = EXCLUDED.allowed_monsters,
    updated_at = now()
  RETURNING id INTO v_drop_id;

  RETURN v_drop_id;
END;
$function$;