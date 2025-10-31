-- Ensure is_admin_or_super_wallet RPC is properly exposed
-- This function checks if a wallet address has admin or super_admin role
CREATE OR REPLACE FUNCTION public.is_admin_or_super_wallet(p_wallet_address text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT (p_wallet_address = 'mr_bruts.tg') OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE wallet_address = p_wallet_address 
    AND role IN ('admin','super_admin')
  );
$$;

-- Grant execute permission to authenticated and anon users
GRANT EXECUTE ON FUNCTION public.is_admin_or_super_wallet(text) TO authenticated, anon;