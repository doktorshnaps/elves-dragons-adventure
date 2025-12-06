-- Create shop_sessions table for secure purchase verification
CREATE TABLE public.shop_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  session_token TEXT NOT NULL UNIQUE,
  item_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '5 minutes'),
  used_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

-- Add index for fast token lookup
CREATE INDEX idx_shop_sessions_token ON public.shop_sessions(session_token);
CREATE INDEX idx_shop_sessions_wallet ON public.shop_sessions(wallet_address);
CREATE INDEX idx_shop_sessions_cleanup ON public.shop_sessions(expires_at);

-- Enable RLS
ALTER TABLE public.shop_sessions ENABLE ROW LEVEL SECURITY;

-- Only service role can access (Edge Functions)
CREATE POLICY "Service role full access on shop_sessions"
  ON public.shop_sessions
  FOR ALL
  USING (current_setting('role') = 'service_role')
  WITH CHECK (current_setting('role') = 'service_role');

-- Function to create a shop session
CREATE OR REPLACE FUNCTION public.create_shop_session(
  p_wallet_address TEXT,
  p_item_id INTEGER,
  p_quantity INTEGER DEFAULT 1
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session_token TEXT;
BEGIN
  -- Generate unique session token
  v_session_token := encode(gen_random_bytes(32), 'hex');
  
  -- Insert new session
  INSERT INTO shop_sessions (wallet_address, session_token, item_id, quantity)
  VALUES (p_wallet_address, v_session_token, p_item_id, p_quantity);
  
  RETURN v_session_token;
END;
$$;

-- Function to validate and consume shop session
CREATE OR REPLACE FUNCTION public.validate_shop_session(
  p_session_token TEXT
)
RETURNS TABLE(
  wallet_address TEXT,
  item_id INTEGER,
  quantity INTEGER,
  is_valid BOOLEAN,
  error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session RECORD;
BEGIN
  -- Find session by token
  SELECT * INTO v_session
  FROM shop_sessions s
  WHERE s.session_token = p_session_token;
  
  -- Check if session exists
  IF v_session IS NULL THEN
    RETURN QUERY SELECT 
      NULL::TEXT, 
      NULL::INTEGER, 
      NULL::INTEGER, 
      FALSE, 
      'Session not found'::TEXT;
    RETURN;
  END IF;
  
  -- Check if already used
  IF v_session.used_at IS NOT NULL THEN
    RETURN QUERY SELECT 
      NULL::TEXT, 
      NULL::INTEGER, 
      NULL::INTEGER, 
      FALSE, 
      'Session already used'::TEXT;
    RETURN;
  END IF;
  
  -- Check if expired
  IF v_session.expires_at < now() THEN
    RETURN QUERY SELECT 
      NULL::TEXT, 
      NULL::INTEGER, 
      NULL::INTEGER, 
      FALSE, 
      'Session expired'::TEXT;
    RETURN;
  END IF;
  
  -- Mark session as used
  UPDATE shop_sessions
  SET used_at = now()
  WHERE session_token = p_session_token;
  
  -- Return valid session data
  RETURN QUERY SELECT 
    v_session.wallet_address, 
    v_session.item_id, 
    v_session.quantity, 
    TRUE, 
    NULL::TEXT;
END;
$$;

-- Automatic cleanup trigger for expired sessions
CREATE OR REPLACE FUNCTION public.cleanup_expired_shop_sessions()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete sessions older than 1 hour
  DELETE FROM shop_sessions
  WHERE expires_at < now() - interval '1 hour';
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_cleanup_expired_shop_sessions
  AFTER INSERT ON shop_sessions
  FOR EACH STATEMENT
  EXECUTE FUNCTION cleanup_expired_shop_sessions();