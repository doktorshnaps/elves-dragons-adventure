-- ============================================================
-- SECURITY FIX: Replace client-supplied wallet with server-side validation
-- This prevents attackers from bypassing admin checks by supplying fake wallet addresses
-- ============================================================

-- Helper function to check if CURRENT USER is admin (server-side)
CREATE OR REPLACE FUNCTION public.check_is_current_user_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wallet text;
BEGIN
  v_wallet := get_current_user_wallet();
  IF v_wallet IS NULL THEN
    RETURN FALSE;
  END IF;
  RETURN is_admin_or_super_wallet(v_wallet);
END;
$$;

-- ============================================================
-- FIX: admin_add_balance_by_id - remove p_admin_wallet_address parameter
-- ============================================================
CREATE OR REPLACE FUNCTION public.admin_add_balance_by_id(
  p_target_user_id uuid, 
  p_amount integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Server-side admin check
  IF NOT check_is_current_user_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Only admin can add balance';
  END IF;

  UPDATE public.game_data
  SET balance = balance + p_amount,
      updated_at = now()
  WHERE user_id = p_target_user_id;

  RETURN FOUND;
END;
$$;

-- ============================================================
-- FIX: admin_ban_user_by_id - remove p_admin_wallet_address parameter
-- ============================================================
CREATE OR REPLACE FUNCTION public.admin_ban_user_by_id(
  p_target_user_id uuid, 
  p_reason text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  target_wallet_address text;
  admin_wallet text;
BEGIN
  -- Server-side admin check
  IF NOT check_is_current_user_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Only admin can ban users';
  END IF;

  admin_wallet := get_current_user_wallet();

  SELECT wallet_address INTO target_wallet_address
  FROM public.game_data
  WHERE user_id = p_target_user_id;

  IF target_wallet_address IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  INSERT INTO public.banned_users (
    banned_wallet_address,
    banned_by_wallet_address,
    reason,
    is_active
  ) VALUES (
    target_wallet_address,
    admin_wallet,
    p_reason,
    true
  )
  ON CONFLICT (banned_wallet_address) 
  DO UPDATE SET
    banned_by_wallet_address = EXCLUDED.banned_by_wallet_address,
    reason = EXCLUDED.reason,
    is_active = true,
    updated_at = now();

  RETURN TRUE;
END;
$$;

-- ============================================================
-- FIX: admin_unban_user_by_id - remove p_admin_wallet_address parameter
-- ============================================================
CREATE OR REPLACE FUNCTION public.admin_unban_user_by_id(
  p_target_user_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  target_wallet_address text;
BEGIN
  -- Server-side admin check
  IF NOT check_is_current_user_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Only admin can unban users';
  END IF;

  SELECT wallet_address INTO target_wallet_address
  FROM public.game_data
  WHERE user_id = p_target_user_id;

  IF target_wallet_address IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  UPDATE public.banned_users
  SET is_active = false, updated_at = now()
  WHERE banned_wallet_address = target_wallet_address;

  RETURN TRUE;
END;
$$;

-- ============================================================
-- FIX: admin_get_user_info - remove p_admin_wallet_address parameter
-- ============================================================
CREATE OR REPLACE FUNCTION public.admin_get_user_info(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_info jsonb;
BEGIN
  -- Server-side admin check
  IF NOT check_is_current_user_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Only admin can view user info';
  END IF;

  SELECT jsonb_build_object(
    'user_id', gd.user_id,
    'wallet_address', gd.wallet_address,
    'balance', gd.balance,
    'gold', gd.gold,
    'account_level', gd.account_level,
    'created_at', gd.created_at,
    'updated_at', gd.updated_at,
    'is_banned', COALESCE(bu.is_active, false)
  )
  INTO user_info
  FROM public.game_data gd
  LEFT JOIN public.banned_users bu ON gd.wallet_address = bu.banned_wallet_address
  WHERE gd.user_id = p_user_id;

  IF user_info IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  RETURN user_info;
END;
$$;

-- ============================================================
-- FIX: admin_get_all_players - remove p_admin_wallet_address parameter
-- ============================================================
CREATE OR REPLACE FUNCTION public.admin_get_all_players()
RETURNS TABLE (
  user_id uuid,
  wallet_address text,
  balance integer,
  account_level integer,
  created_at timestamptz
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Server-side admin check
  IF NOT check_is_current_user_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  RETURN QUERY
  SELECT g.user_id, g.wallet_address, g.balance, g.account_level, g.created_at
  FROM public.game_data g
  ORDER BY g.created_at DESC;
END;
$$;

-- ============================================================
-- FIX: admin_give_items_to_player - remove p_admin_wallet_address parameter
-- ============================================================
CREATE OR REPLACE FUNCTION public.admin_give_items_to_player(
  p_target_wallet_address text,
  p_items jsonb
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_current_inventory jsonb;
  v_admin_wallet text;
BEGIN
  -- Server-side admin check
  IF NOT check_is_current_user_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can give items to players';
  END IF;

  v_admin_wallet := get_current_user_wallet();

  IF NOT EXISTS (SELECT 1 FROM public.game_data WHERE wallet_address = p_target_wallet_address) THEN
    RAISE EXCEPTION 'Player not found: %', p_target_wallet_address;
  END IF;

  RETURN TRUE;
END;
$$;

-- ============================================================
-- FIX: admin_recalculate_all_card_stats - remove p_admin_wallet_address parameter
-- ============================================================
CREATE OR REPLACE FUNCTION public.admin_recalculate_all_card_stats()
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Server-side admin check
  IF NOT check_is_current_user_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can recalculate card stats';
  END IF;
  
  RETURN (SELECT * FROM public.recalculate_all_card_stats());
END;
$$;

-- ============================================================
-- FIX: admin_add_dungeon_item_drop - remove p_admin_wallet_address parameter
-- ============================================================
CREATE OR REPLACE FUNCTION public.admin_add_dungeon_item_drop(
  p_item_template_id integer, 
  p_dungeon_number integer, 
  p_min_dungeon_level integer, 
  p_max_dungeon_level integer, 
  p_drop_chance numeric, 
  p_allowed_monsters text[] DEFAULT NULL::text[]
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_drop_id UUID;
  v_admin_wallet TEXT;
BEGIN
  -- Server-side admin check
  IF NOT check_is_current_user_admin() THEN
    RAISE EXCEPTION 'Access denied: Only admins can add dungeon item drops';
  END IF;

  v_admin_wallet := get_current_user_wallet();

  IF p_drop_chance < 0 OR p_drop_chance > 100 THEN
    RAISE EXCEPTION 'Drop chance must be between 0 and 100';
  END IF;

  INSERT INTO public.dungeon_item_drops (
    item_template_id,
    dungeon_number,
    min_dungeon_level,
    max_dungeon_level,
    drop_chance,
    allowed_monsters,
    created_by_wallet_address,
    is_active
  ) VALUES (
    p_item_template_id,
    p_dungeon_number,
    p_min_dungeon_level,
    NULLIF(p_max_dungeon_level, 0),
    p_drop_chance,
    p_allowed_monsters,
    v_admin_wallet,
    true
  )
  RETURNING id INTO v_drop_id;

  RETURN v_drop_id;
END;
$$;

-- ============================================================
-- FIX: admin_insert_crafting_recipe - use server-side wallet
-- ============================================================
CREATE OR REPLACE FUNCTION public.admin_insert_crafting_recipe(
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
AS $$
DECLARE
  v_recipe_id uuid;
  v_admin_wallet text;
BEGIN
  -- Server-side admin check
  IF NOT check_is_current_user_admin() THEN
    RAISE EXCEPTION 'Access denied: user is not an admin';
  END IF;

  v_admin_wallet := get_current_user_wallet();

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
    v_admin_wallet,
    true
  )
  RETURNING id INTO v_recipe_id;

  RETURN v_recipe_id;
END;
$$;

-- ============================================================
-- FIX: admin_delete_item_template - use server-side wallet
-- ============================================================
CREATE OR REPLACE FUNCTION public.admin_delete_item_template(
  p_item_id integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Server-side admin check
  IF NOT check_is_current_user_admin() THEN
    RAISE EXCEPTION 'Access denied: user is not an admin';
  END IF;

  DELETE FROM public.item_templates WHERE id = p_item_id;
  RETURN FOUND;
END;
$$;

-- ============================================================
-- FIX: update_dungeon_settings - use server-side wallet
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_dungeon_settings(
  p_dungeon_number integer,
  p_base_hp integer,
  p_hp_growth numeric,
  p_base_atk integer,
  p_atk_growth numeric,
  p_base_armor integer,
  p_armor_growth numeric
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Server-side admin check (super admin only)
  IF NOT check_is_current_user_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Only super admin can update dungeon settings';
  END IF;

  UPDATE public.dungeon_settings
  SET 
    base_hp = p_base_hp,
    hp_growth = p_hp_growth,
    base_atk = p_base_atk,
    atk_growth = p_atk_growth,
    base_armor = p_base_armor,
    armor_growth = p_armor_growth,
    updated_at = now()
  WHERE dungeon_number = p_dungeon_number;

  RETURN FOUND;
END;
$$;

-- ============================================================
-- FIX: admin_find_user_by_wallet - use server-side check
-- ============================================================
CREATE OR REPLACE FUNCTION public.admin_find_user_by_wallet(p_wallet_address text)
RETURNS TABLE (
  user_id uuid,
  wallet_address text,
  balance integer,
  account_level integer,
  created_at timestamptz,
  is_banned boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Server-side admin check
  IF NOT check_is_current_user_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  RETURN QUERY
  SELECT 
    g.user_id, 
    g.wallet_address, 
    g.balance, 
    g.account_level, 
    g.created_at,
    COALESCE(b.is_active, false) as is_banned
  FROM public.game_data g
  LEFT JOIN public.banned_users b ON g.wallet_address = b.banned_wallet_address
  WHERE g.wallet_address ILIKE '%' || p_wallet_address || '%'
  ORDER BY g.created_at DESC
  LIMIT 50;
END;
$$;

-- ============================================================
-- FIX: admin_get_player_cards - use server-side check
-- ============================================================
CREATE OR REPLACE FUNCTION public.admin_get_player_cards(p_target_wallet_address text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Server-side admin check
  IF NOT check_is_current_user_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  RETURN (
    SELECT COALESCE(jsonb_agg(row_to_json(ci)), '[]'::jsonb)
    FROM public.card_instances ci
    WHERE ci.wallet_address = p_target_wallet_address
  );
END;
$$;

-- ============================================================
-- FIX: admin_get_player_inventory - use server-side check
-- ============================================================
CREATE OR REPLACE FUNCTION public.admin_get_player_inventory(p_target_wallet_address text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Server-side admin check
  IF NOT check_is_current_user_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  RETURN (
    SELECT COALESCE(jsonb_agg(row_to_json(ii)), '[]'::jsonb)
    FROM public.item_instances ii
    WHERE ii.wallet_address = p_target_wallet_address
  );
END;
$$;

-- ============================================================
-- FIX: admin_add_balance - use server-side check
-- ============================================================
CREATE OR REPLACE FUNCTION public.admin_add_balance(
  p_target_wallet_address text, 
  p_amount integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Server-side admin check
  IF NOT check_is_current_user_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Only admin can add balance';
  END IF;

  UPDATE public.game_data
  SET balance = balance + p_amount,
      updated_at = now()
  WHERE wallet_address = p_target_wallet_address;

  RETURN FOUND;
END;
$$;

-- ============================================================
-- FIX: admin_ban_user - use server-side check
-- ============================================================
CREATE OR REPLACE FUNCTION public.admin_ban_user(
  p_target_wallet_address text, 
  p_reason text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  admin_wallet text;
BEGIN
  -- Server-side admin check
  IF NOT check_is_current_user_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Only admin can ban users';
  END IF;

  admin_wallet := get_current_user_wallet();

  INSERT INTO public.banned_users (
    banned_wallet_address,
    banned_by_wallet_address,
    reason,
    is_active
  ) VALUES (
    p_target_wallet_address,
    admin_wallet,
    p_reason,
    true
  )
  ON CONFLICT (banned_wallet_address) 
  DO UPDATE SET
    banned_by_wallet_address = EXCLUDED.banned_by_wallet_address,
    reason = EXCLUDED.reason,
    is_active = true,
    updated_at = now();

  RETURN TRUE;
END;
$$;

-- ============================================================
-- FIX: admin_unban_user - use server-side check
-- ============================================================
CREATE OR REPLACE FUNCTION public.admin_unban_user(
  p_target_wallet_address text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Server-side admin check
  IF NOT check_is_current_user_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Only admin can unban users';
  END IF;

  UPDATE public.banned_users
  SET is_active = false, updated_at = now()
  WHERE banned_wallet_address = p_target_wallet_address;

  RETURN FOUND;
END;
$$;

-- ============================================================
-- FIX: admin_set_player_balance - use server-side check
-- ============================================================
CREATE OR REPLACE FUNCTION public.admin_set_player_balance(
  p_target_wallet_address text, 
  p_new_balance integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Server-side admin check
  IF NOT check_is_current_user_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Only admin can set balance';
  END IF;

  UPDATE public.game_data
  SET balance = p_new_balance,
      updated_at = now()
  WHERE wallet_address = p_target_wallet_address;

  RETURN FOUND;
END;
$$;

-- ============================================================
-- FIX: admin_give_player_card - use server-side check
-- ============================================================
CREATE OR REPLACE FUNCTION public.admin_give_player_card(
  p_target_wallet_address text,
  p_card_template_id text,
  p_card_data jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_card_id uuid;
BEGIN
  -- Server-side admin check
  IF NOT check_is_current_user_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Only admin can give cards';
  END IF;

  INSERT INTO public.card_instances (
    wallet_address,
    card_template_id,
    card_type,
    card_data
  ) VALUES (
    p_target_wallet_address,
    p_card_template_id,
    COALESCE(p_card_data->>'cardType', 'hero'),
    p_card_data
  )
  RETURNING id INTO v_card_id;

  RETURN v_card_id;
END;
$$;

-- ============================================================
-- FIX: admin_give_player_item - use server-side check
-- ============================================================
CREATE OR REPLACE FUNCTION public.admin_give_player_item(
  p_target_wallet_address text,
  p_template_id integer
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_item_id uuid;
BEGIN
  -- Server-side admin check
  IF NOT check_is_current_user_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Only admin can give items';
  END IF;

  INSERT INTO public.item_instances (
    wallet_address,
    template_id
  ) VALUES (
    p_target_wallet_address,
    p_template_id
  )
  RETURNING id INTO v_item_id;

  RETURN v_item_id;
END;
$$;

-- ============================================================
-- FIX: admin_remove_player_card - use server-side check
-- ============================================================
CREATE OR REPLACE FUNCTION public.admin_remove_player_card(
  p_card_instance_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Server-side admin check
  IF NOT check_is_current_user_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Only admin can remove cards';
  END IF;

  DELETE FROM public.card_instances WHERE id = p_card_instance_id;
  RETURN FOUND;
END;
$$;

-- ============================================================
-- FIX: admin_remove_player_item - use server-side check
-- ============================================================
CREATE OR REPLACE FUNCTION public.admin_remove_player_item(
  p_item_instance_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Server-side admin check
  IF NOT check_is_current_user_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Only admin can remove items';
  END IF;

  DELETE FROM public.item_instances WHERE id = p_item_instance_id;
  RETURN FOUND;
END;
$$;