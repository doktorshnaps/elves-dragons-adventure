
-- Create pvp_match_sessions table for secure session-based auth
CREATE TABLE IF NOT EXISTS public.pvp_match_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES public.pvp_matches(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  session_token UUID NOT NULL DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '2 hours'),
  UNIQUE(match_id, wallet_address)
);

-- Index for fast session_token lookups
CREATE INDEX idx_pvp_match_sessions_token ON public.pvp_match_sessions(session_token);
CREATE INDEX idx_pvp_match_sessions_match ON public.pvp_match_sessions(match_id);

-- Enable RLS - block direct access, use only via RPCs
ALTER TABLE public.pvp_match_sessions ENABLE ROW LEVEL SECURITY;

-- No direct access policies - all access through SECURITY DEFINER functions

-- RPC: Create or get existing session for a wallet+match
CREATE OR REPLACE FUNCTION public.create_pvp_match_session(
  p_wallet_address TEXT,
  p_match_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_match RECORD;
  v_session RECORD;
  v_token UUID;
BEGIN
  -- Verify match exists and wallet is a participant
  SELECT * INTO v_match
  FROM pvp_matches
  WHERE id = p_match_id
    AND status IN ('active', 'waiting')
    AND (player1_wallet = p_wallet_address OR player2_wallet = p_wallet_address);

  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Match not found or you are not a participant');
  END IF;

  -- Check for existing valid session
  SELECT * INTO v_session
  FROM pvp_match_sessions
  WHERE match_id = p_match_id
    AND wallet_address = p_wallet_address
    AND expires_at > now();

  IF FOUND THEN
    RETURN json_build_object('session_token', v_session.session_token);
  END IF;

  -- Delete expired sessions for this match+wallet
  DELETE FROM pvp_match_sessions
  WHERE match_id = p_match_id
    AND wallet_address = p_wallet_address;

  -- Create new session
  v_token := gen_random_uuid();
  INSERT INTO pvp_match_sessions (match_id, wallet_address, session_token)
  VALUES (p_match_id, p_wallet_address, v_token);

  RETURN json_build_object('session_token', v_token);
END;
$$;

-- RPC: Validate session token and return wallet_address (used by edge functions)
CREATE OR REPLACE FUNCTION public.validate_pvp_session(
  p_session_token UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session RECORD;
BEGIN
  SELECT * INTO v_session
  FROM pvp_match_sessions
  WHERE session_token = p_session_token
    AND expires_at > now();

  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Invalid or expired session');
  END IF;

  RETURN json_build_object(
    'wallet_address', v_session.wallet_address,
    'match_id', v_session.match_id
  );
END;
$$;
