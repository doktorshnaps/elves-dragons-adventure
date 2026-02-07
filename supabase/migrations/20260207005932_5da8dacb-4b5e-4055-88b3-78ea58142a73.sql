
-- Drop both versions of admin_find_user_by_wallet and recreate with correct types
DROP FUNCTION IF EXISTS public.admin_find_user_by_wallet(text);
DROP FUNCTION IF EXISTS public.admin_find_user_by_wallet(text, text);

CREATE OR REPLACE FUNCTION public.admin_find_user_by_wallet(
  p_wallet_address text,
  p_admin_wallet_address text DEFAULT NULL
)
RETURNS TABLE(
  user_id uuid,
  wallet_address text,
  balance integer,
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

-- Also fix admin_add_balance_by_id - drop old versions and recreate
DROP FUNCTION IF EXISTS public.admin_add_balance_by_id(text, bigint);
DROP FUNCTION IF EXISTS public.admin_add_balance_by_id(text, bigint, text);
DROP FUNCTION IF EXISTS public.admin_add_balance_by_id(text, integer);
DROP FUNCTION IF EXISTS public.admin_add_balance_by_id(text, integer, text);

CREATE OR REPLACE FUNCTION public.admin_add_balance_by_id(
  p_target_user_id text,
  p_amount integer,
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

-- Fix admin_set_player_balance - balance is integer not bigint
DROP FUNCTION IF EXISTS public.admin_set_player_balance(text, bigint);
DROP FUNCTION IF EXISTS public.admin_set_player_balance(text, bigint, text);
DROP FUNCTION IF EXISTS public.admin_set_player_balance(text, integer);
DROP FUNCTION IF EXISTS public.admin_set_player_balance(text, integer, text);

CREATE OR REPLACE FUNCTION public.admin_set_player_balance(
  p_target_wallet_address text,
  p_new_balance integer,
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

-- Fix admin_get_user_info - user_id is uuid not text
DROP FUNCTION IF EXISTS public.admin_get_user_info(text);
DROP FUNCTION IF EXISTS public.admin_get_user_info(text, text);
DROP FUNCTION IF EXISTS public.admin_get_user_info(uuid);

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
  WHERE gd.user_id = p_user_id::uuid;

  IF user_info IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  RETURN user_info;
END;
$$;

-- Fix admin_ban_user_by_id
DROP FUNCTION IF EXISTS public.admin_ban_user_by_id(text, text);
DROP FUNCTION IF EXISTS public.admin_ban_user_by_id(text, text, text);

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
  WHERE user_id = p_target_user_id::uuid;

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

-- Fix admin_unban_user_by_id
DROP FUNCTION IF EXISTS public.admin_unban_user_by_id(text);
DROP FUNCTION IF EXISTS public.admin_unban_user_by_id(text, text);

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
  WHERE user_id = p_target_user_id::uuid;

  IF target_wallet_address IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  UPDATE public.banned_users
  SET is_active = false, updated_at = now()
  WHERE banned_wallet_address = target_wallet_address;

  RETURN TRUE;
END;
$$;
