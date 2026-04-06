
-- Drop old function if exists
DROP FUNCTION IF EXISTS public.save_telegram_chat_id(text, bigint);

-- New v2: upserts chat_id and returns structured result
CREATE OR REPLACE FUNCTION public.save_telegram_chat_id_v2(
  p_wallet_address text,
  p_chat_id bigint
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_found boolean;
BEGIN
  -- Check if row exists
  SELECT EXISTS(
    SELECT 1 FROM game_data WHERE wallet_address = p_wallet_address
  ) INTO v_found;

  IF NOT v_found THEN
    RETURN jsonb_build_object(
      'status', 'no_player',
      'chat_id', NULL,
      'was_updated', false
    );
  END IF;

  -- Update chat_id
  UPDATE game_data
  SET telegram_chat_id = p_chat_id,
      updated_at = now()
  WHERE wallet_address = p_wallet_address;

  RETURN jsonb_build_object(
    'status', 'ok',
    'chat_id', p_chat_id,
    'was_updated', true
  );
END;
$$;

-- RPC to read telegram status without direct SELECT on game_data
CREATE OR REPLACE FUNCTION public.get_telegram_status(
  p_wallet_address text
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_chat_id bigint;
BEGIN
  SELECT telegram_chat_id INTO v_chat_id
  FROM game_data
  WHERE wallet_address = p_wallet_address;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('status', 'no_player', 'chat_id', NULL);
  END IF;

  IF v_chat_id IS NULL THEN
    RETURN jsonb_build_object('status', 'no_chat_id', 'chat_id', NULL);
  END IF;

  RETURN jsonb_build_object('status', 'connected', 'chat_id', v_chat_id);
END;
$$;
