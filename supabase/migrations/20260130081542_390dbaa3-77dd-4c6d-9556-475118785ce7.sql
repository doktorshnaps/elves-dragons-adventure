-- Fix ambiguous column reference in get_active_pvp_matches (RETURNS TABLE columns shadow names)

CREATE OR REPLACE FUNCTION public.get_active_pvp_matches(p_wallet_address text)
RETURNS TABLE(
  match_id uuid,
  opponent_wallet text,
  is_your_turn boolean,
  time_remaining integer,
  rarity_tier integer,
  started_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  WITH ranked AS (
    SELECT pm.id,
           row_number() OVER (
             PARTITION BY pm.player2_wallet, pm.rarity_tier
             ORDER BY pm.created_at DESC
           ) AS rn
    FROM public.pvp_matches pm
    WHERE pm.player1_wallet = p_wallet_address
      AND pm.is_bot_match = true
      AND pm.status = 'active'
  )
  UPDATE public.pvp_matches
  SET status = 'cancelled',
      finished_at = now()
  WHERE id IN (SELECT id FROM ranked WHERE rn > 1);

  RETURN QUERY
  SELECT 
    m.id as match_id,
    CASE WHEN m.player1_wallet = p_wallet_address THEN m.player2_wallet ELSE m.player1_wallet END as opponent_wallet,
    m.current_turn_wallet = p_wallet_address as is_your_turn,
    GREATEST(0, m.turn_timeout_seconds - EXTRACT(EPOCH FROM (now() - m.turn_started_at))::integer) as time_remaining,
    m.rarity_tier,
    m.started_at
  FROM public.pvp_matches m
  WHERE (m.player1_wallet = p_wallet_address OR m.player2_wallet = p_wallet_address)
    AND m.status = 'active'
  ORDER BY 
    (m.current_turn_wallet = p_wallet_address) DESC,
    m.turn_started_at ASC;
END;
$$;