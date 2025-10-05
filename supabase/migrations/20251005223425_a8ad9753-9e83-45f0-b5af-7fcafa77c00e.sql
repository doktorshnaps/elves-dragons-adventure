-- Complete quest via SECURITY DEFINER to bypass RLS safely
CREATE OR REPLACE FUNCTION public.complete_user_quest(
  p_wallet_address text,
  p_quest_id uuid
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_wallet_address IS NULL OR length(trim(p_wallet_address)) = 0 OR p_quest_id IS NULL THEN
    RAISE EXCEPTION 'Invalid parameters';
  END IF;

  INSERT INTO public.user_quest_progress (
    wallet_address, quest_id, completed, completed_at, claimed
  ) VALUES (
    p_wallet_address, p_quest_id, true, now(), false
  )
  ON CONFLICT (wallet_address, quest_id)
  DO UPDATE SET
    completed = true,
    completed_at = now(),
    updated_at = now();

  RETURN true;
END;
$$;

-- Mark quest as claimed
CREATE OR REPLACE FUNCTION public.mark_quest_claimed(
  p_wallet_address text,
  p_quest_id uuid
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_wallet_address IS NULL OR length(trim(p_wallet_address)) = 0 OR p_quest_id IS NULL THEN
    RAISE EXCEPTION 'Invalid parameters';
  END IF;

  UPDATE public.user_quest_progress
  SET claimed = true,
      claimed_at = now(),
      updated_at = now()
  WHERE wallet_address = p_wallet_address
    AND quest_id = p_quest_id;

  RETURN FOUND;
END;
$$;