-- Drop conflicting function signatures before recreating
DROP FUNCTION IF EXISTS public.claim_quest_and_reward(text, uuid);
DROP FUNCTION IF EXISTS public.get_user_quest_progress(text);

-- Recreate get_user_quest_progress with explicit columns
CREATE OR REPLACE FUNCTION public.get_user_quest_progress(p_wallet_address text)
RETURNS TABLE(
  quest_id uuid,
  completed boolean,
  claimed boolean,
  completed_at timestamptz,
  claimed_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    uqp.quest_id,
    uqp.completed,
    uqp.claimed,
    uqp.completed_at,
    uqp.claimed_at
  FROM public.user_quest_progress AS uqp
  WHERE uqp.wallet_address = p_wallet_address
$$;

-- Recreate idempotent claim_quest_and_reward
CREATE OR REPLACE FUNCTION public.claim_quest_and_reward(
  p_wallet_address text,
  p_quest_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_progress public.user_quest_progress%ROWTYPE;
  v_reward integer := 0;
  v_balance integer := 0;
BEGIN
  -- Lock existing progress row if present and pick the most recent if multiple
  SELECT * INTO v_progress
  FROM public.user_quest_progress u
  WHERE u.wallet_address = p_wallet_address
    AND u.quest_id = p_quest_id
  ORDER BY u.created_at DESC
  FOR UPDATE
  LIMIT 1;

  -- Ensure a progress row exists and mark as completed
  IF v_progress.id IS NULL THEN
    INSERT INTO public.user_quest_progress (
      wallet_address, quest_id, completed, completed_at, claimed
    ) VALUES (
      p_wallet_address, p_quest_id, true, now(), false
    )
    RETURNING * INTO v_progress;
  ELSIF v_progress.completed IS FALSE THEN
    UPDATE public.user_quest_progress
    SET completed = true,
        completed_at = now()
    WHERE id = v_progress.id
    RETURNING * INTO v_progress;
  END IF;

  -- If already claimed, return current balance without error (idempotent)
  IF v_progress.claimed IS TRUE THEN
    SELECT gd.balance INTO v_balance
    FROM public.game_data gd
    WHERE gd.wallet_address = p_wallet_address
    ORDER BY gd.created_at DESC
    LIMIT 1;

    RETURN json_build_object(
      'balance', COALESCE(v_balance, 0),
      'reward', 0
    );
  END IF;

  -- Get quest reward if active (default to 0 if not found)
  SELECT q.reward_coins INTO v_reward
  FROM public.quests q
  WHERE q.id = p_quest_id AND q.is_active = true
  LIMIT 1;

  IF v_reward IS NULL THEN
    v_reward := 0;
  END IF;

  -- Mark claimed
  UPDATE public.user_quest_progress
  SET claimed = true,
      claimed_at = now()
  WHERE id = v_progress.id;

  -- Add balance to existing game_data row for this wallet
  UPDATE public.game_data gd
  SET balance = gd.balance + v_reward,
      updated_at = now()
  WHERE gd.wallet_address = p_wallet_address
  RETURNING gd.balance INTO v_balance;

  RETURN json_build_object(
    'balance', COALESCE(v_balance, 0),
    'reward', v_reward
  );
END;
$$;

-- Ensure function privileges (allow anon to execute under SECURITY DEFINER)
REVOKE ALL ON FUNCTION public.get_user_quest_progress(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_user_quest_progress(text) TO anon, authenticated, service_role;

REVOKE ALL ON FUNCTION public.claim_quest_and_reward(text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_quest_and_reward(text, uuid) TO anon, authenticated, service_role;