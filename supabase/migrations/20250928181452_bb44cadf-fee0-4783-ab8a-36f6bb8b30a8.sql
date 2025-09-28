-- Fix the maintenance mode function to include WHERE clause
CREATE OR REPLACE FUNCTION public.admin_toggle_maintenance_mode(
  p_enabled boolean, 
  p_message text DEFAULT NULL,
  p_admin_wallet_address text DEFAULT 'mr_bruts.tg'
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Check if caller is admin
  IF p_admin_wallet_address != 'mr_bruts.tg' THEN
    RAISE EXCEPTION 'Unauthorized: Only admin can toggle maintenance mode';
  END IF;

  -- Update maintenance mode status with WHERE clause
  UPDATE public.maintenance_mode 
  SET 
    is_enabled = p_enabled,
    message = COALESCE(p_message, message),
    enabled_by_wallet_address = p_admin_wallet_address,
    updated_at = now()
  WHERE id IS NOT NULL; -- This ensures we have a WHERE clause

  -- If no rows were updated, ensure at least one record exists
  IF NOT FOUND THEN
    INSERT INTO public.maintenance_mode (is_enabled, message, enabled_by_wallet_address)
    VALUES (p_enabled, COALESCE(p_message, 'Ведутся технические работы. Игра временно недоступна.'), p_admin_wallet_address);
  END IF;

  RETURN TRUE;
END;
$$;