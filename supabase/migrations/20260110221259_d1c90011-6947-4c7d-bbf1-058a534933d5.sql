-- Drop existing function and recreate with correct type
DROP FUNCTION IF EXISTS public.admin_get_mgt_exchange_requests(text,text,text);

CREATE FUNCTION public.admin_get_mgt_exchange_requests(
  p_admin_wallet_address TEXT,
  p_status TEXT DEFAULT NULL,
  p_search TEXT DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  wallet_address text,
  amount numeric,
  status text,
  admin_notes text,
  processed_at timestamptz,
  processed_by text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin_or_super_wallet(p_admin_wallet_address) THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;

  RETURN QUERY
  SELECT 
    r.id,
    r.wallet_address,
    r.amount,
    r.status,
    r.admin_notes,
    r.processed_at,
    r.processed_by,
    r.created_at,
    r.updated_at
  FROM public.mgt_exchange_requests r
  WHERE 
    (p_status IS NULL OR r.status = p_status)
    AND (p_search IS NULL OR p_search = '' OR r.wallet_address ILIKE '%' || p_search || '%')
  ORDER BY r.created_at DESC;
END;
$$;