-- Fix 1: allow super_admin access for admin RPCs (use existing is_admin_or_super_wallet)
-- Fix 2: prevent duplicate pending requests per wallet (cleanup + unique partial index + robust insert)

-- 1) Update admin list RPC
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

-- 2) Update admin process RPC
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
  IF NOT public.is_admin_or_super_wallet(p_admin_wallet_address) THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;

  SELECT * INTO v_request FROM public.mgt_exchange_requests WHERE id = p_request_id;
  IF v_request IS NULL THEN
    RAISE EXCEPTION 'Request not found';
  END IF;

  IF v_request.status != 'pending' THEN
    RAISE EXCEPTION 'Request already processed';
  END IF;

  IF p_action = 'approve' THEN
    UPDATE public.game_data 
    SET mgt_balance = COALESCE(mgt_balance, 0) - v_request.amount,
        updated_at = now()
    WHERE wallet_address = v_request.wallet_address
      AND COALESCE(mgt_balance, 0) >= v_request.amount;
    
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Insufficient mGT balance';
    END IF;

    UPDATE public.mgt_exchange_requests
    SET status = 'approved',
        admin_notes = p_admin_notes,
        processed_at = now(),
        processed_by = p_admin_wallet_address,
        updated_at = now()
    WHERE id = p_request_id;

  ELSIF p_action = 'reject' THEN
    UPDATE public.mgt_exchange_requests
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

-- 3) Cleanup duplicates: keep newest pending per wallet
WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (PARTITION BY wallet_address ORDER BY created_at DESC) AS rn
  FROM public.mgt_exchange_requests
  WHERE status = 'pending'
)
DELETE FROM public.mgt_exchange_requests r
USING ranked
WHERE r.id = ranked.id
  AND ranked.rn > 1;

-- 4) Enforce at most one pending request per wallet
CREATE UNIQUE INDEX IF NOT EXISTS ux_mgt_exchange_requests_pending_wallet
ON public.mgt_exchange_requests (wallet_address)
WHERE status = 'pending';

-- 5) Make submit function concurrency-safe using unique index
CREATE OR REPLACE FUNCTION public.submit_mgt_exchange_request(
  p_wallet_address TEXT,
  p_amount INTEGER
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_balance INTEGER;
  v_new_request_id uuid;
BEGIN
  IF p_wallet_address IS NULL OR p_wallet_address = '' THEN
    RAISE EXCEPTION 'Wallet address is required';
  END IF;

  IF p_amount < 2000 THEN
    RAISE EXCEPTION 'Minimum exchange amount is 2000 mGT';
  END IF;

  -- Check balance
  SELECT COALESCE(mgt_balance, 0) INTO v_current_balance
  FROM public.game_data
  WHERE wallet_address = p_wallet_address;

  IF v_current_balance IS NULL THEN
    RAISE EXCEPTION 'Game data not found for this wallet';
  END IF;

  IF v_current_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient mGT balance. You have % mGT but requested %', v_current_balance, p_amount;
  END IF;

  -- Insert (unique partial index prevents duplicate pending per wallet)
  BEGIN
    INSERT INTO public.mgt_exchange_requests (wallet_address, amount, status)
    VALUES (p_wallet_address, p_amount, 'pending')
    RETURNING id INTO v_new_request_id;
  EXCEPTION
    WHEN unique_violation THEN
      RAISE EXCEPTION 'You already have a pending exchange request';
  END;

  RETURN v_new_request_id;
END;
$$;