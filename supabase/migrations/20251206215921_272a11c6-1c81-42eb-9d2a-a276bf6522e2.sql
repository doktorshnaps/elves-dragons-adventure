-- Drop and recreate the create_shop_session function using gen_random_uuid() instead of gen_random_bytes()
DROP FUNCTION IF EXISTS public.create_shop_session(text, integer, integer);

CREATE OR REPLACE FUNCTION public.create_shop_session(
  p_wallet_address text,
  p_item_id integer,
  p_quantity integer DEFAULT 1
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session_token text;
BEGIN
  -- Generate a unique session token using UUID (no pgcrypto needed)
  v_session_token := replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');
  
  -- Insert the session
  INSERT INTO shop_sessions (
    wallet_address,
    session_token,
    item_id,
    quantity,
    expires_at
  ) VALUES (
    p_wallet_address,
    v_session_token,
    p_item_id,
    p_quantity,
    now() + interval '5 minutes'
  );
  
  RETURN v_session_token;
END;
$$;