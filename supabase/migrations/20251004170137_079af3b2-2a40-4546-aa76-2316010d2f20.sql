-- Create helper function to check admin role by wallet
CREATE OR REPLACE FUNCTION public.has_admin_role(p_wallet_address text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.user_roles 
    WHERE wallet_address = p_wallet_address 
      AND role = 'admin'
  );
$$;

-- Function to add user to whitelist
CREATE OR REPLACE FUNCTION public.admin_add_to_whitelist(
  p_wallet_address text,
  p_notes text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_admin_wallet text;
BEGIN
  -- Get current user's wallet
  v_admin_wallet := get_current_user_wallet();
  
  -- Check if user is admin
  IF NOT (v_admin_wallet = 'mr_bruts.tg' OR has_admin_role(v_admin_wallet)) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can add to whitelist';
  END IF;

  -- Insert or update whitelist entry
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
  ON CONFLICT (wallet_address) 
  DO UPDATE SET 
    is_active = true,
    notes = COALESCE(p_notes, whitelist.notes),
    added_by_wallet_address = v_admin_wallet,
    whitelist_source = 'manual',
    updated_at = now();

  RETURN TRUE;
END;
$$;

-- Function to remove user from whitelist
CREATE OR REPLACE FUNCTION public.admin_remove_from_whitelist(
  p_wallet_address text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_admin_wallet text;
BEGIN
  -- Get current user's wallet
  v_admin_wallet := get_current_user_wallet();
  
  -- Check if user is admin
  IF NOT (v_admin_wallet = 'mr_bruts.tg' OR has_admin_role(v_admin_wallet)) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can remove from whitelist';
  END IF;

  -- Deactivate whitelist entry
  UPDATE public.whitelist
  SET is_active = false,
      updated_at = now()
  WHERE wallet_address = p_wallet_address;

  RETURN TRUE;
END;
$$;

-- Function to ban user
CREATE OR REPLACE FUNCTION public.admin_ban_user(
  p_target_wallet_address text,
  p_reason text,
  p_admin_wallet_address text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_admin_wallet text;
BEGIN
  -- Use provided admin wallet or get current user's wallet
  v_admin_wallet := COALESCE(p_admin_wallet_address, get_current_user_wallet());
  
  -- Check if user is admin
  IF NOT (v_admin_wallet = 'mr_bruts.tg' OR has_admin_role(v_admin_wallet)) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can ban users';
  END IF;

  -- Insert ban record
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

-- Function to unban user
CREATE OR REPLACE FUNCTION public.admin_unban_user(
  p_target_wallet_address text,
  p_admin_wallet_address text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_admin_wallet text;
BEGIN
  -- Use provided admin wallet or get current user's wallet
  v_admin_wallet := COALESCE(p_admin_wallet_address, get_current_user_wallet());
  
  -- Check if user is admin
  IF NOT (v_admin_wallet = 'mr_bruts.tg' OR has_admin_role(v_admin_wallet)) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can unban users';
  END IF;

  -- Deactivate ban records
  UPDATE public.banned_users 
  SET is_active = false,
      updated_at = now()
  WHERE banned_wallet_address = p_target_wallet_address 
    AND is_active = true;

  RETURN TRUE;
END;
$$;

-- Update RLS policies
DROP POLICY IF EXISTS "Admins can insert banned users" ON public.banned_users;
CREATE POLICY "Admins can insert banned users"
ON public.banned_users
FOR INSERT
WITH CHECK (
  get_current_user_wallet() = 'mr_bruts.tg' OR 
  has_admin_role(get_current_user_wallet())
);

DROP POLICY IF EXISTS "Admins can insert whitelist entries" ON public.whitelist;
CREATE POLICY "Admins can insert whitelist entries"
ON public.whitelist
FOR INSERT
WITH CHECK (
  get_current_user_wallet() = 'mr_bruts.tg' OR 
  has_admin_role(get_current_user_wallet())
);