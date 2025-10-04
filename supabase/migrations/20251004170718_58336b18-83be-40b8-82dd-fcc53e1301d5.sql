-- Helper: check if wallet is super admin or has admin role
CREATE OR REPLACE FUNCTION public.is_admin_or_super_wallet(p_wallet_address text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (p_wallet_address = 'mr_bruts.tg') OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE wallet_address = p_wallet_address AND role = 'admin'
  );
$$;

-- Update admin_add_to_whitelist to accept admin wallet param
CREATE OR REPLACE FUNCTION public.admin_add_to_whitelist(
  p_wallet_address text,
  p_notes text DEFAULT NULL,
  p_admin_wallet_address text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_wallet text := COALESCE(p_admin_wallet_address, get_current_user_wallet());
BEGIN
  IF NOT is_admin_or_super_wallet(v_admin_wallet) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can add to whitelist';
  END IF;

  INSERT INTO public.whitelist (
    wallet_address,
    added_by_wallet_address,
    notes,
    whitelist_source
  ) VALUES (
    p_wallet_address,
    v_admin_wallet,
    p_notes,
    'manual'
  )
  ON CONFLICT (wallet_address) DO UPDATE SET 
    is_active = true,
    notes = COALESCE(p_notes, whitelist.notes),
    added_by_wallet_address = v_admin_wallet,
    whitelist_source = 'manual',
    updated_at = now();

  RETURN TRUE;
END;
$$;

-- Update admin_remove_from_whitelist to accept admin wallet param
CREATE OR REPLACE FUNCTION public.admin_remove_from_whitelist(
  p_wallet_address text,
  p_admin_wallet_address text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_wallet text := COALESCE(p_admin_wallet_address, get_current_user_wallet());
BEGIN
  IF NOT is_admin_or_super_wallet(v_admin_wallet) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can remove from whitelist';
  END IF;

  UPDATE public.whitelist
  SET is_active = false,
      updated_at = now()
  WHERE wallet_address = p_wallet_address;

  RETURN TRUE;
END;
$$;

-- Update admin_ban_user and admin_unban_user to use is_admin_or_super_wallet
CREATE OR REPLACE FUNCTION public.admin_ban_user(
  p_target_wallet_address text,
  p_reason text,
  p_admin_wallet_address text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_wallet text := COALESCE(p_admin_wallet_address, get_current_user_wallet());
BEGIN
  IF NOT is_admin_or_super_wallet(v_admin_wallet) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can ban users';
  END IF;

  INSERT INTO public.banned_users (
    banned_wallet_address,
    banned_by_wallet_address,
    reason
  ) VALUES (
    p_target_wallet_address,
    v_admin_wallet,
    p_reason
  );

  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_unban_user(
  p_target_wallet_address text,
  p_admin_wallet_address text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_wallet text := COALESCE(p_admin_wallet_address, get_current_user_wallet());
BEGIN
  IF NOT is_admin_or_super_wallet(v_admin_wallet) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can unban users';
  END IF;

  UPDATE public.banned_users 
  SET is_active = false,
      updated_at = now()
  WHERE banned_wallet_address = p_target_wallet_address 
    AND is_active = true;

  RETURN TRUE;
END;
$$;