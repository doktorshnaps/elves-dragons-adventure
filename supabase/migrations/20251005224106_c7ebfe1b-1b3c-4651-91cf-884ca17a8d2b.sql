-- Secure RPC to fetch user quest progress bypassing RLS
CREATE OR REPLACE FUNCTION public.get_user_quest_progress(
  p_wallet_address text
) RETURNS TABLE(
  quest_id uuid,
  completed boolean,
  claimed boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_wallet_address IS NULL OR length(trim(p_wallet_address)) = 0 THEN
    RAISE EXCEPTION 'Invalid wallet';
  END IF;

  RETURN QUERY
  SELECT quest_id, completed, claimed
  FROM public.user_quest_progress
  WHERE wallet_address = p_wallet_address;
END;
$$;