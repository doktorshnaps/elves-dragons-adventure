
-- 1. Replace the SELECT policy: from "completed" to "active/waiting" only
DROP POLICY IF EXISTS "Anyone can view completed matches" ON public.pvp_matches;

CREATE POLICY "Anyone can view active matches"
  ON public.pvp_matches FOR SELECT
  USING (status IN ('active', 'waiting'));

-- 2. Create get_my_match_history RPC
CREATE OR REPLACE FUNCTION public.get_my_match_history(
  p_wallet text,
  p_rarity_tier integer,
  p_limit integer DEFAULT 20
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN COALESCE((
    SELECT jsonb_agg(row_to_json(m.*)::jsonb ORDER BY m.finished_at DESC)
    FROM (
      SELECT id, player1_wallet, player2_wallet, winner_wallet, loser_wallet,
             elo_change, player1_elo_before, player2_elo_before, finished_at,
             is_bot_match, rarity_tier
      FROM pvp_matches
      WHERE status = 'completed'
        AND rarity_tier = p_rarity_tier
        AND (player1_wallet = p_wallet OR player2_wallet = p_wallet)
      ORDER BY finished_at DESC
      LIMIT p_limit
    ) m
  ), '[]'::jsonb);
END;
$$;

-- 3. Create get_pvp_league_stats RPC
CREATE OR REPLACE FUNCTION public.get_pvp_league_stats(
  p_rarity_tier integer,
  p_limit integer DEFAULT 50
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN COALESCE((
    SELECT jsonb_agg(row_to_json(r.*)::jsonb ORDER BY r.wins DESC)
    FROM (
      SELECT wallet_address, wins, losses, matches_played,
             CASE WHEN matches_played > 0 
               THEN ROUND((wins::numeric / matches_played) * 100)
               ELSE 0 
             END as win_rate
      FROM pvp_ratings
      WHERE rarity_tier = p_rarity_tier
        AND season_id = get_active_pvp_season()
        AND matches_played > 0
      ORDER BY wins DESC
      LIMIT p_limit
    ) r
  ), '[]'::jsonb);
END;
$$;
