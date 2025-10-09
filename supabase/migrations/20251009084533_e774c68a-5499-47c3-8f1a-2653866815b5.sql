-- Referral stats and details RPC to bypass RLS safely via SECURITY DEFINER
-- 1) Aggregated leaderboard and totals
CREATE OR REPLACE FUNCTION public.get_referral_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  week_start timestamptz;
  week_end timestamptz;
  all_time jsonb;
  weekly jsonb;
  totals jsonb;
BEGIN
  -- Weeks start on Monday in Postgres date_trunc('week')
  week_start := date_trunc('week', now());
  week_end := week_start + interval '7 days';

  -- All-time leaderboard
  all_time := (
    SELECT coalesce(jsonb_agg(row_to_json(t)), '[]'::jsonb)
    FROM (
      SELECT 
        r.referrer_wallet_address AS wallet_address,
        COUNT(*)::int AS total_referrals,
        SUM(CASE WHEN w.wallet_address IS NOT NULL THEN 1 ELSE 0 END)::int AS wl_referrals,
        (COUNT(*) - SUM(CASE WHEN w.wallet_address IS NOT NULL THEN 1 ELSE 0 END))::int AS no_wl_referrals
      FROM public.referrals r
      LEFT JOIN public.whitelist w
        ON w.wallet_address = r.referred_wallet_address AND w.is_active = true
      WHERE r.is_active = true
      GROUP BY r.referrer_wallet_address
      ORDER BY total_referrals DESC
    ) t
  );

  -- Weekly leaderboard (Mon-Sun)
  weekly := (
    SELECT coalesce(jsonb_agg(row_to_json(t)), '[]'::jsonb)
    FROM (
      SELECT 
        r.referrer_wallet_address AS wallet_address,
        COUNT(*)::int AS weekly_referrals,
        SUM(CASE WHEN w.wallet_address IS NOT NULL THEN 1 ELSE 0 END)::int AS weekly_wl_referrals,
        (COUNT(*) - SUM(CASE WHEN w.wallet_address IS NOT NULL THEN 1 ELSE 0 END))::int AS weekly_no_wl_referrals
      FROM public.referrals r
      LEFT JOIN public.whitelist w
        ON w.wallet_address = r.referred_wallet_address AND w.is_active = true
      WHERE r.is_active = true
        AND r.created_at >= week_start AND r.created_at < week_end
      GROUP BY r.referrer_wallet_address
      ORDER BY weekly_referrals DESC
    ) t
  );

  -- Totals (players and referrals)
  totals := jsonb_build_object(
    'totalPlayers', (SELECT COUNT(*)::int FROM public.game_data WHERE coalesce(initialized, true) = true),
    'totalReferrals', (SELECT COUNT(*)::int FROM public.referrals WHERE is_active = true),
    'weeklyTotalReferrals', (SELECT COUNT(*)::int FROM public.referrals WHERE is_active = true AND created_at >= week_start AND created_at < week_end)
  );

  RETURN jsonb_build_object(
    'all_time', all_time,
    'weekly', weekly,
    'totals', totals,
    'lastUpdated', now()
  );
END;
$$;

-- 2) Detailed referrals list per referrer with optional WL filter
CREATE OR REPLACE FUNCTION public.get_referral_details(p_referrer_wallet text, p_wl_only boolean DEFAULT NULL)
RETURNS TABLE(wallet_address text, created_at timestamptz, has_wl boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.referred_wallet_address,
    r.created_at,
    EXISTS (
      SELECT 1 FROM public.whitelist w 
      WHERE w.wallet_address = r.referred_wallet_address AND w.is_active = true
    ) AS has_wl
  FROM public.referrals r
  WHERE r.is_active = true 
    AND r.referrer_wallet_address = p_referrer_wallet
    AND (
      p_wl_only IS NULL OR
      (p_wl_only = true AND EXISTS (SELECT 1 FROM public.whitelist w WHERE w.wallet_address = r.referred_wallet_address AND w.is_active = true)) OR
      (p_wl_only = false AND NOT EXISTS (SELECT 1 FROM public.whitelist w WHERE w.wallet_address = r.referred_wallet_address AND w.is_active = true))
    )
  ORDER BY r.created_at DESC;
END;
$$;
