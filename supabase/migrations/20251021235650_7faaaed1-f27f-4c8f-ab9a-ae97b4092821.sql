-- Admin RPC to add or upsert whitelist contracts securely
CREATE OR REPLACE FUNCTION public.admin_add_whitelist_contract(
  p_admin_wallet_address text,
  p_contract_address text,
  p_contract_name text,
  p_description text,
  p_is_active boolean DEFAULT true
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_id uuid;
BEGIN
  -- Check admin or super admin rights
  IF NOT public.is_admin_or_super_wallet(p_admin_wallet_address) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can add whitelist contracts';
  END IF;

  INSERT INTO public.whitelist_contracts (
    contract_address,
    contract_name,
    description,
    added_by_wallet_address,
    is_active
  ) VALUES (
    p_contract_address,
    NULLIF(trim(p_contract_name), ''),
    NULLIF(trim(p_description), ''),
    p_admin_wallet_address,
    COALESCE(p_is_active, true)
  )
  ON CONFLICT (contract_address)
  DO UPDATE SET
    contract_name = EXCLUDED.contract_name,
    description = EXCLUDED.description,
    is_active = EXCLUDED.is_active,
    updated_at = now()
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;