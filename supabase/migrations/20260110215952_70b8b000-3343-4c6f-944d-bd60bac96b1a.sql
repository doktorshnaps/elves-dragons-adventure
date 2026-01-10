-- Create function for admins to fetch exchange requests
CREATE OR REPLACE FUNCTION public.admin_get_mgt_exchange_requests(
  p_admin_wallet_address TEXT,
  p_status TEXT DEFAULT NULL,
  p_search TEXT DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  wallet_address text,
  amount integer,
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
  -- Check if caller is admin
  IF NOT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.wallet_address = p_admin_wallet_address 
    AND user_roles.role = 'admin'
  ) THEN
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
  FROM mgt_exchange_requests r
  WHERE 
    (p_status IS NULL OR r.status = p_status)
    AND (p_search IS NULL OR p_search = '' OR r.wallet_address ILIKE '%' || p_search || '%')
  ORDER BY r.created_at DESC;
END;
$$;

-- Create function for admin to approve/reject requests
CREATE OR REPLACE FUNCTION public.admin_process_mgt_exchange_request(
  p_admin_wallet_address TEXT,
  p_request_id uuid,
  p_action TEXT, -- 'approve' or 'reject'
  p_admin_notes TEXT DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request RECORD;
BEGIN
  -- Check if caller is admin
  IF NOT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.wallet_address = p_admin_wallet_address 
    AND user_roles.role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;

  -- Get the request
  SELECT * INTO v_request FROM mgt_exchange_requests WHERE id = p_request_id;
  
  IF v_request IS NULL THEN
    RAISE EXCEPTION 'Request not found';
  END IF;

  IF v_request.status != 'pending' THEN
    RAISE EXCEPTION 'Request already processed';
  END IF;

  IF p_action = 'approve' THEN
    -- Deduct mGT from player
    UPDATE game_data 
    SET mgt_balance = COALESCE(mgt_balance, 0) - v_request.amount,
        updated_at = now()
    WHERE wallet_address = v_request.wallet_address
      AND COALESCE(mgt_balance, 0) >= v_request.amount;
    
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Insufficient mGT balance';
    END IF;

    -- Update request status
    UPDATE mgt_exchange_requests
    SET status = 'approved',
        admin_notes = p_admin_notes,
        processed_at = now(),
        processed_by = p_admin_wallet_address,
        updated_at = now()
    WHERE id = p_request_id;

  ELSIF p_action = 'reject' THEN
    UPDATE mgt_exchange_requests
    SET status = 'rejected',
        admin_notes = p_admin_notes,
        processed_at = now(),
        processed_by = p_admin_wallet_address,
        updated_at = now()
    WHERE id = p_request_id;
  ELSE
    RAISE EXCEPTION 'Invalid action. Use approve or reject';
  END IF;

  RETURN true;
END;
$$;