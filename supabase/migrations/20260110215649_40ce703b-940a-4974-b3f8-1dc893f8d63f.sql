-- Create a function to submit mGT exchange requests
-- This bypasses RLS by using wallet_address directly

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
  v_pending_count INTEGER;
  v_current_balance INTEGER;
  v_new_request_id uuid;
BEGIN
  -- Validate wallet address
  IF p_wallet_address IS NULL OR p_wallet_address = '' THEN
    RAISE EXCEPTION 'Wallet address is required';
  END IF;

  -- Validate amount
  IF p_amount < 2000 THEN
    RAISE EXCEPTION 'Minimum exchange amount is 2000 mGT';
  END IF;

  -- Check if user has a pending request already
  SELECT COUNT(*) INTO v_pending_count
  FROM mgt_exchange_requests
  WHERE wallet_address = p_wallet_address
    AND status = 'pending';

  IF v_pending_count > 0 THEN
    RAISE EXCEPTION 'You already have a pending exchange request';
  END IF;

  -- Check if user has enough mGT balance
  SELECT COALESCE(mgt_balance, 0) INTO v_current_balance
  FROM game_data
  WHERE wallet_address = p_wallet_address;

  IF v_current_balance IS NULL THEN
    RAISE EXCEPTION 'Game data not found for this wallet';
  END IF;

  IF v_current_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient mGT balance. You have % mGT but requested %', v_current_balance, p_amount;
  END IF;

  -- Create the exchange request
  INSERT INTO mgt_exchange_requests (wallet_address, amount, status)
  VALUES (p_wallet_address, p_amount, 'pending')
  RETURNING id INTO v_new_request_id;

  RETURN v_new_request_id;
END;
$$;