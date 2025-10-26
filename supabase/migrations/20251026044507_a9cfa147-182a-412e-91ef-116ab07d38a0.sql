-- Fix remove_card_instance_exact to correctly return boolean based on affected rows
-- and ensure it is callable by anon/authenticated via PostgREST

-- Recreate function with correct variable types and search_path
CREATE OR REPLACE FUNCTION public.remove_card_instance_exact(
  p_wallet_address text,
  p_instance_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted integer := 0;
BEGIN
  DELETE FROM public.card_instances
  WHERE id = p_instance_id
    AND wallet_address = p_wallet_address;

  GET DIAGNOSTICS v_deleted = ROW_COUNT;

  RETURN v_deleted > 0;
END;
$$;

-- Ensure execute permissions for PostgREST roles
GRANT EXECUTE ON FUNCTION public.remove_card_instance_exact(text, uuid) TO anon, authenticated;