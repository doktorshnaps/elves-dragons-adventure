-- Функция для проверки прав super_admin
CREATE OR REPLACE FUNCTION public.is_super_admin_wallet(p_wallet_address text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Проверяем наличие роли super_admin для данного кошелька
  RETURN EXISTS (
    SELECT 1 
    FROM public.user_roles
    WHERE wallet_address = p_wallet_address
      AND role = 'super_admin'
  );
END;
$$;