
CREATE OR REPLACE FUNCTION public.get_pvp_dice_stats(p_days integer DEFAULT 7)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'period_days', p_days,
    'stats', COALESCE((
      SELECT jsonb_agg(row_to_json(s))
      FROM (
        SELECT
          CASE WHEN m.player_wallet LIKE 'BOT_%' THEN 'bot' ELSE 'human' END AS player_type,
          m.dice_roll_attacker AS roll,
          count(*) AS count
        FROM pvp_moves m
        WHERE m.created_at >= now() - (p_days || ' days')::interval
          AND m.dice_roll_attacker IS NOT NULL
        GROUP BY 1, 2
        ORDER BY 1, 2
      ) s
    ), '[]'::jsonb)
  );
$$;
