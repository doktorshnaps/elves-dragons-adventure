CREATE OR REPLACE FUNCTION public.claim_quest_and_reward(
  p_wallet_address text,
  p_quest_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_progress RECORD;
  v_reward integer := 0;
  v_new_balance integer;
BEGIN
  IF p_wallet_address IS NULL OR length(trim(p_wallet_address)) = 0 OR p_quest_id IS NULL THEN
    RAISE EXCEPTION 'Invalid parameters';
  END IF;

  -- Fetch or create progress row and lock it
  SELECT * INTO v_progress
  FROM public.user_quest_progress
  WHERE wallet_address = p_wallet_address AND quest_id = p_quest_id
  FOR UPDATE;

  IF v_progress IS NULL THEN
    INSERT INTO public.user_quest_progress (wallet_address, quest_id, completed, claimed, completed_at)
    VALUES (p_wallet_address, p_quest_id, true, false, now());
  ELSIF v_progress.claimed THEN
    RAISE EXCEPTION 'Quest already claimed';
  END IF;

  -- Load reward from quests table (only active quests)
  SELECT COALESCE(reward_coins, 0) INTO v_reward
  FROM public.quests
  WHERE id = p_quest_id AND is_active = true;

  -- Mark as claimed and completed
  UPDATE public.user_quest_progress
  SET completed = true,
      claimed = true,
      completed_at = COALESCE(completed_at, now()),
      claimed_at = now(),
      updated_at = now()
  WHERE wallet_address = p_wallet_address AND quest_id = p_quest_id;

  -- Add reward to balance atomically
  UPDATE public.game_data
  SET balance = balance + v_reward,
      updated_at = now()
  WHERE wallet_address = p_wallet_address
  RETURNING balance INTO v_new_balance;

  RETURN jsonb_build_object(
    'claimed', true,
    'reward', v_reward,
    'balance', v_new_balance
  );
END;
$$;