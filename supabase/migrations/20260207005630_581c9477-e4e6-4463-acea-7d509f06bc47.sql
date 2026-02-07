
-- Fix admin RPC functions to accept admin wallet address parameter
-- instead of relying on auth.uid() which doesn't work with NEAR wallet auth

-- 1. admin_find_user_by_wallet
CREATE OR REPLACE FUNCTION public.admin_find_user_by_wallet(
  p_wallet_address text,
  p_admin_wallet_address text DEFAULT NULL
)
RETURNS TABLE(
  user_id text,
  wallet_address text,
  balance bigint,
  account_level integer,
  created_at timestamptz,
  is_banned boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_admin_or_super_wallet(COALESCE(p_admin_wallet_address, '')) THEN
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

-- 2. admin_get_user_info
CREATE OR REPLACE FUNCTION public.admin_get_user_info(
  p_user_id text,
  p_admin_wallet_address text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_info jsonb;
BEGIN
  IF NOT is_admin_or_super_wallet(COALESCE(p_admin_wallet_address, '')) THEN
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

-- 3. admin_ban_user_by_id
CREATE OR REPLACE FUNCTION public.admin_ban_user_by_id(
  p_target_user_id text,
  p_reason text,
  p_admin_wallet_address text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_wallet_address text;
BEGIN
  IF NOT is_admin_or_super_wallet(COALESCE(p_admin_wallet_address, '')) THEN
    RAISE EXCEPTION 'Unauthorized: Only admin can ban users';
  END IF;

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
    COALESCE(p_admin_wallet_address, 'unknown'),
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

-- 4. admin_unban_user_by_id
CREATE OR REPLACE FUNCTION public.admin_unban_user_by_id(
  p_target_user_id text,
  p_admin_wallet_address text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_wallet_address text;
BEGIN
  IF NOT is_admin_or_super_wallet(COALESCE(p_admin_wallet_address, '')) THEN
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

-- 5. admin_get_player_cards
CREATE OR REPLACE FUNCTION public.admin_get_player_cards(
  p_target_wallet_address text,
  p_admin_wallet_address text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_admin_or_super_wallet(COALESCE(p_admin_wallet_address, '')) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  RETURN (
    SELECT COALESCE(jsonb_agg(row_to_json(ci)), '[]'::jsonb)
    FROM public.card_instances ci
    WHERE ci.wallet_address = p_target_wallet_address
  );
END;
$$;

-- 6. admin_get_player_inventory
CREATE OR REPLACE FUNCTION public.admin_get_player_inventory(
  p_target_wallet_address text,
  p_admin_wallet_address text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_admin_or_super_wallet(COALESCE(p_admin_wallet_address, '')) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  RETURN (
    SELECT COALESCE(jsonb_agg(row_to_json(ii)), '[]'::jsonb)
    FROM public.item_instances ii
    WHERE ii.wallet_address = p_target_wallet_address
  );
END;
$$;

-- 7. admin_set_player_balance
CREATE OR REPLACE FUNCTION public.admin_set_player_balance(
  p_target_wallet_address text,
  p_new_balance bigint,
  p_admin_wallet_address text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_admin_or_super_wallet(COALESCE(p_admin_wallet_address, '')) THEN
    RAISE EXCEPTION 'Unauthorized: Only admin can set balance';
  END IF;

  UPDATE public.game_data
  SET balance = p_new_balance,
      updated_at = now()
  WHERE wallet_address = p_target_wallet_address;

  RETURN FOUND;
END;
$$;

-- 8. admin_add_balance_by_id (fix the version without wallet param)
CREATE OR REPLACE FUNCTION public.admin_add_balance_by_id(
  p_target_user_id text,
  p_amount bigint,
  p_admin_wallet_address text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_admin_or_super_wallet(COALESCE(p_admin_wallet_address, '')) THEN
    RAISE EXCEPTION 'Unauthorized: Only admin can add balance';
  END IF;

  UPDATE public.game_data
  SET balance = balance + p_amount,
      updated_at = now()
  WHERE user_id = p_target_user_id;

  RETURN FOUND;
END;
$$;

-- 9. admin_remove_player_card
CREATE OR REPLACE FUNCTION public.admin_remove_player_card(
  p_card_instance_id text,
  p_admin_wallet_address text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_admin_or_super_wallet(COALESCE(p_admin_wallet_address, '')) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  DELETE FROM public.card_instances
  WHERE id = p_card_instance_id;

  RETURN FOUND;
END;
$$;

-- 10. admin_remove_player_item
CREATE OR REPLACE FUNCTION public.admin_remove_player_item(
  p_item_instance_id text,
  p_admin_wallet_address text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_admin_or_super_wallet(COALESCE(p_admin_wallet_address, '')) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  DELETE FROM public.item_instances
  WHERE id = p_item_instance_id;

  RETURN FOUND;
END;
$$;

-- 11. admin_give_player_card
CREATE OR REPLACE FUNCTION public.admin_give_player_card(
  p_target_wallet_address text,
  p_card_template_id text,
  p_card_data jsonb,
  p_admin_wallet_address text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_card_id uuid;
  v_rarity int;
  v_card_type text;
BEGIN
  IF NOT is_admin_or_super_wallet(COALESCE(p_admin_wallet_address, '')) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  v_rarity := COALESCE((p_card_data->>'rarity')::int, 1);
  v_card_type := COALESCE(p_card_data->>'type', 'character');

  INSERT INTO public.card_instances (
    wallet_address,
    card_template_id,
    card_type,
    card_data,
    max_power,
    max_defense,
    max_health,
    current_health,
    current_defense,
    max_magic
  ) VALUES (
    p_target_wallet_address,
    p_card_template_id,
    v_card_type,
    p_card_data,
    COALESCE((p_card_data->>'power')::int, 0),
    COALESCE((p_card_data->>'defense')::int, 0),
    COALESCE((p_card_data->>'health')::int, 0),
    COALESCE((p_card_data->>'health')::int, 0),
    COALESCE((p_card_data->>'defense')::int, 0),
    COALESCE((p_card_data->>'magic')::int, 0)
  )
  RETURNING id INTO v_card_id;

  RETURN v_card_id;
END;
$$;

-- 12. admin_give_player_item
CREATE OR REPLACE FUNCTION public.admin_give_player_item(
  p_target_wallet_address text,
  p_template_id int,
  p_admin_wallet_address text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item_id uuid;
  v_item_name text;
  v_item_type text;
  v_item_item_id text;
BEGIN
  IF NOT is_admin_or_super_wallet(COALESCE(p_admin_wallet_address, '')) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT name, type, item_id INTO v_item_name, v_item_type, v_item_item_id
  FROM public.item_templates
  WHERE id = p_template_id;

  IF v_item_name IS NULL THEN
    RAISE EXCEPTION 'Item template not found';
  END IF;

  INSERT INTO public.item_instances (
    wallet_address,
    template_id,
    name,
    type,
    item_id
  ) VALUES (
    p_target_wallet_address,
    p_template_id,
    v_item_name,
    v_item_type,
    v_item_item_id
  )
  RETURNING id INTO v_item_id;

  RETURN v_item_id;
END;
$$;
