-- Update admin functions to use user_id instead of wallet_address

-- Function to add balance by user_id
CREATE OR REPLACE FUNCTION public.admin_add_balance_by_id(p_target_user_id uuid, p_amount integer, p_admin_wallet_address text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Check if caller is admin
  IF p_admin_wallet_address != 'mr_bruts.tg' THEN
    RAISE EXCEPTION 'Unauthorized: Only admin can add balance';
  END IF;

  -- Check if target user exists
  IF NOT EXISTS (SELECT 1 FROM public.game_data WHERE user_id = p_target_user_id) THEN
    RAISE EXCEPTION 'User not found: %', p_target_user_id;
  END IF;

  -- Add balance
  UPDATE public.game_data 
  SET balance = balance + p_amount,
      updated_at = now()
  WHERE user_id = p_target_user_id;

  RETURN TRUE;
END;
$function$;

-- Function to ban user by user_id
CREATE OR REPLACE FUNCTION public.admin_ban_user_by_id(p_target_user_id uuid, p_reason text, p_admin_wallet_address text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  target_wallet_address text;
BEGIN
  -- Check if caller is admin
  IF p_admin_wallet_address != 'mr_bruts.tg' THEN
    RAISE EXCEPTION 'Unauthorized: Only admin can ban users';
  END IF;

  -- Get wallet address for the user_id
  SELECT wallet_address INTO target_wallet_address 
  FROM public.game_data 
  WHERE user_id = p_target_user_id;

  IF target_wallet_address IS NULL THEN
    RAISE EXCEPTION 'User not found: %', p_target_user_id;
  END IF;

  -- Insert ban record
  INSERT INTO public.banned_users (
    banned_wallet_address,
    banned_by_wallet_address,
    reason
  ) VALUES (
    target_wallet_address,
    p_admin_wallet_address,
    p_reason
  );

  RETURN TRUE;
END;
$function$;

-- Function to unban user by user_id
CREATE OR REPLACE FUNCTION public.admin_unban_user_by_id(p_target_user_id uuid, p_admin_wallet_address text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  target_wallet_address text;
BEGIN
  -- Check if caller is admin
  IF p_admin_wallet_address != 'mr_bruts.tg' THEN
    RAISE EXCEPTION 'Unauthorized: Only admin can unban users';
  END IF;

  -- Get wallet address for the user_id
  SELECT wallet_address INTO target_wallet_address 
  FROM public.game_data 
  WHERE user_id = p_target_user_id;

  IF target_wallet_address IS NULL THEN
    RAISE EXCEPTION 'User not found: %', p_target_user_id;
  END IF;

  -- Deactivate ban records
  UPDATE public.banned_users 
  SET is_active = false,
      updated_at = now()
  WHERE banned_wallet_address = target_wallet_address 
    AND is_active = true;

  RETURN TRUE;
END;
$function$;

-- Function to get user info by UUID (for admin lookup)
CREATE OR REPLACE FUNCTION public.admin_get_user_info(p_user_id uuid, p_admin_wallet_address text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  user_info jsonb;
BEGIN
  -- Check if caller is admin
  IF p_admin_wallet_address != 'mr_bruts.tg' THEN
    RAISE EXCEPTION 'Unauthorized: Only admin can view user info';
  END IF;

  -- Get user information
  SELECT jsonb_build_object(
    'user_id', gd.user_id,
    'wallet_address', gd.wallet_address,
    'balance', gd.balance,
    'account_level', gd.account_level,
    'created_at', gd.created_at,
    'is_banned', EXISTS(
      SELECT 1 FROM public.banned_users bu 
      WHERE bu.banned_wallet_address = gd.wallet_address 
      AND bu.is_active = true
    )
  ) INTO user_info
  FROM public.game_data gd
  WHERE gd.user_id = p_user_id;

  IF user_info IS NULL THEN
    RAISE EXCEPTION 'User not found: %', p_user_id;
  END IF;

  RETURN user_info;
END;
$function$;