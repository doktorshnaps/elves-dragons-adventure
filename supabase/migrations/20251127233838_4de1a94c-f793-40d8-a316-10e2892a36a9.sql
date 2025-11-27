-- Fix generate_claim_nonce to use built-in UUID function
CREATE OR REPLACE FUNCTION public.generate_claim_nonce(
  p_wallet_address TEXT,
  p_session_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_nonce TEXT;
  v_expires_at TIMESTAMPTZ;
BEGIN
  -- Generate nonce using built-in UUID function (no extensions needed)
  v_nonce := replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');
  v_expires_at := now() + interval '5 minutes';
  
  -- Save nonce
  INSERT INTO public.claim_nonces (nonce, wallet_address, session_id, expires_at)
  VALUES (v_nonce, p_wallet_address, p_session_id, v_expires_at);
  
  -- Return nonce and expiry time
  RETURN json_build_object(
    'nonce', v_nonce,
    'expires_at', v_expires_at,
    'session_id', p_session_id
  );
END;
$$;