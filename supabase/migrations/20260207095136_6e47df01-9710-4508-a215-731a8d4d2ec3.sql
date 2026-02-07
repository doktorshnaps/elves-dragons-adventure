
-- Part 1: Add rewards_distributed column to pvp_seasons
ALTER TABLE public.pvp_seasons 
ADD COLUMN IF NOT EXISTS rewards_distributed boolean DEFAULT false;

-- Part 2: admin_create_pvp_season
CREATE OR REPLACE FUNCTION public.admin_create_pvp_season(
  p_admin_wallet_address text,
  p_name text,
  p_duration_days integer,
  p_rewards_config jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_season_id uuid;
  v_next_season_number integer;
BEGIN
  IF NOT is_admin_or_super_wallet(COALESCE(p_admin_wallet_address, '')) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can create seasons';
  END IF;

  -- Deactivate any currently active season
  UPDATE public.pvp_seasons
  SET is_active = false, ends_at = now(), updated_at = now()
  WHERE is_active = true;

  -- Get next season number
  SELECT COALESCE(MAX(season_number), 0) + 1 INTO v_next_season_number
  FROM public.pvp_seasons;

  -- Create new season
  INSERT INTO public.pvp_seasons (
    id, season_number, name, starts_at, ends_at, is_active, rewards_config, rewards_distributed
  ) VALUES (
    gen_random_uuid(),
    v_next_season_number,
    p_name,
    now(),
    now() + (p_duration_days || ' days')::interval,
    true,
    p_rewards_config,
    false
  )
  RETURNING id INTO v_season_id;

  RETURN v_season_id;
END;
$$;

-- Part 3: admin_update_pvp_season
CREATE OR REPLACE FUNCTION public.admin_update_pvp_season(
  p_admin_wallet_address text,
  p_season_id uuid,
  p_name text DEFAULT NULL,
  p_ends_at timestamptz DEFAULT NULL,
  p_rewards_config jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_admin_or_super_wallet(COALESCE(p_admin_wallet_address, '')) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can update seasons';
  END IF;

  -- Only allow editing active seasons
  IF NOT EXISTS (SELECT 1 FROM public.pvp_seasons WHERE id = p_season_id AND is_active = true) THEN
    RAISE EXCEPTION 'Season not found or already ended';
  END IF;

  UPDATE public.pvp_seasons
  SET 
    name = COALESCE(p_name, name),
    ends_at = COALESCE(p_ends_at, ends_at),
    rewards_config = COALESCE(p_rewards_config, rewards_config),
    updated_at = now()
  WHERE id = p_season_id;
END;
$$;

-- Part 4: admin_end_pvp_season
CREATE OR REPLACE FUNCTION public.admin_end_pvp_season(
  p_admin_wallet_address text,
  p_season_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_admin_or_super_wallet(COALESCE(p_admin_wallet_address, '')) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can end seasons';
  END IF;

  UPDATE public.pvp_seasons
  SET is_active = false, ends_at = now(), updated_at = now()
  WHERE id = p_season_id AND is_active = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Season not found or already ended';
  END IF;

  RETURN p_season_id;
END;
$$;

-- Part 5: get_pvp_season_leaderboard
CREATE OR REPLACE FUNCTION public.get_pvp_season_leaderboard(
  p_season_id uuid,
  p_limit integer DEFAULT 50
)
RETURNS TABLE(
  rank bigint,
  wallet_address text,
  elo integer,
  tier text,
  wins integer,
  losses integer,
  matches_played integer,
  win_streak integer,
  best_win_streak integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ROW_NUMBER() OVER (ORDER BY r.elo DESC, r.wins DESC) as rank,
    r.wallet_address,
    r.elo,
    r.tier,
    r.wins,
    r.losses,
    r.matches_played,
    r.win_streak,
    r.best_win_streak
  FROM public.pvp_ratings r
  WHERE r.season_id = p_season_id
    AND r.wallet_address NOT LIKE 'BOT_%'
  ORDER BY r.elo DESC, r.wins DESC
  LIMIT p_limit;
END;
$$;

-- Part 6: admin_distribute_season_rewards
CREATE OR REPLACE FUNCTION public.admin_distribute_season_rewards(
  p_admin_wallet_address text,
  p_season_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_season record;
  v_player record;
  v_rewards_config jsonb;
  v_tier_config jsonb;
  v_reward_amount numeric;
  v_total_distributed numeric := 0;
  v_players_rewarded integer := 0;
  v_tier_key text;
BEGIN
  IF NOT is_admin_or_super_wallet(COALESCE(p_admin_wallet_address, '')) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can distribute rewards';
  END IF;

  -- Get season info
  SELECT * INTO v_season FROM public.pvp_seasons WHERE id = p_season_id;
  
  IF v_season IS NULL THEN
    RAISE EXCEPTION 'Season not found';
  END IF;

  IF v_season.is_active = true THEN
    RAISE EXCEPTION 'Cannot distribute rewards for an active season. End the season first.';
  END IF;

  IF v_season.rewards_distributed = true THEN
    RAISE EXCEPTION 'Rewards have already been distributed for this season';
  END IF;

  v_rewards_config := v_season.rewards_config;

  -- Iterate through all players in this season
  FOR v_player IN 
    SELECT r.wallet_address, r.elo, r.tier
    FROM public.pvp_ratings r
    WHERE r.season_id = p_season_id
      AND r.wallet_address NOT LIKE 'BOT_%'
      AND r.matches_played > 0
  LOOP
    -- Find matching tier config by checking elo against each tier's min/max
    v_reward_amount := 0;
    
    FOR v_tier_key IN SELECT jsonb_object_keys(v_rewards_config)
    LOOP
      v_tier_config := v_rewards_config -> v_tier_key;
      
      IF v_player.elo >= COALESCE((v_tier_config ->> 'min_elo')::integer, 0)
         AND v_player.elo <= COALESCE((v_tier_config ->> 'max_elo')::integer, 99999) THEN
        v_reward_amount := COALESCE((v_tier_config ->> 'ell_reward')::numeric, 0);
      END IF;
    END LOOP;

    -- Add ELL reward if any
    IF v_reward_amount > 0 THEN
      PERFORM add_ell_balance(v_player.wallet_address, v_reward_amount);
      v_total_distributed := v_total_distributed + v_reward_amount;
      v_players_rewarded := v_players_rewarded + 1;
    END IF;
  END LOOP;

  -- Mark season as rewards distributed
  UPDATE public.pvp_seasons
  SET rewards_distributed = true, updated_at = now()
  WHERE id = p_season_id;

  RETURN jsonb_build_object(
    'players_rewarded', v_players_rewarded,
    'total_ell_distributed', v_total_distributed,
    'season_id', p_season_id
  );
END;
$$;
