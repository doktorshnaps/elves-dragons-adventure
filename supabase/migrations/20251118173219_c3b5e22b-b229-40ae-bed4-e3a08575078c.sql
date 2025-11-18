-- Add search_path to all remaining SECURITY DEFINER functions

-- Update is_admin_or_super_wallet to ensure search_path is set
CREATE OR REPLACE FUNCTION public.is_admin_or_super_wallet(p_wallet_address text)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (
    p_wallet_address = 'mr_bruts.tg' OR
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE wallet_address = p_wallet_address
      AND role IN ('admin', 'super_admin')
    )
  );
END;
$$;

-- Update is_super_admin_wallet to ensure search_path is set
CREATE OR REPLACE FUNCTION public.is_super_admin_wallet(p_wallet_address text)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (
    p_wallet_address = 'mr_bruts.tg' OR
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE wallet_address = p_wallet_address
      AND role = 'super_admin'
    )
  );
END;
$$;

-- Update has_role to ensure search_path is set (if it exists)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
$$;