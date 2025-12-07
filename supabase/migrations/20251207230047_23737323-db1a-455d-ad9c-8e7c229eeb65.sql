-- Restore whitelist_contracts table for NFT items
CREATE TABLE IF NOT EXISTS public.whitelist_contracts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id text NOT NULL UNIQUE,
  contract_name text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by_wallet_address text NOT NULL
);

-- Enable RLS
ALTER TABLE public.whitelist_contracts ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Anyone can view active whitelist contracts"
ON public.whitelist_contracts
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can insert whitelist contracts"
ON public.whitelist_contracts
FOR INSERT
WITH CHECK (is_admin_or_super_wallet(created_by_wallet_address));

CREATE POLICY "Admins can update whitelist contracts"
ON public.whitelist_contracts
FOR UPDATE
USING (is_admin_or_super_wallet(get_current_user_wallet()));

CREATE POLICY "Admins can delete whitelist contracts"
ON public.whitelist_contracts
FOR DELETE
USING (is_admin_or_super_wallet(get_current_user_wallet()));

-- Restore admin function
CREATE OR REPLACE FUNCTION public.admin_add_whitelist_contract(
  p_admin_wallet_address text,
  p_contract_id text,
  p_contract_name text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_admin_or_super_wallet(p_admin_wallet_address) THEN
    RAISE EXCEPTION 'Access denied: not an admin';
  END IF;

  INSERT INTO whitelist_contracts (contract_id, contract_name, created_by_wallet_address)
  VALUES (p_contract_id, p_contract_name, p_admin_wallet_address)
  ON CONFLICT (contract_id) DO UPDATE SET
    contract_name = EXCLUDED.contract_name,
    is_active = true,
    updated_at = now();

  RETURN true;
END;
$$;