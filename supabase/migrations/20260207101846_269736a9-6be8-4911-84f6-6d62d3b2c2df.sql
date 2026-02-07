
-- Add league_rewards_config column to pvp_seasons
ALTER TABLE public.pvp_seasons
ADD COLUMN IF NOT EXISTS league_rewards_config jsonb DEFAULT '{}'::jsonb;

-- Update admin_create_pvp_season to accept league_rewards_config
CREATE OR REPLACE FUNCTION public.admin_create_pvp_season(
  p_admin_wallet_address text,
  p_name text,
  p_duration_days integer DEFAULT 30,
  p_rewards_config jsonb DEFAULT '{}'::jsonb,
  p_league_rewards_config jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_season_number integer;
  v_season_id uuid;
  v_starts_at timestamptz;
  v_ends_at timestamptz;
BEGIN
  -- Verify admin
  IF NOT public.is_admin_or_super_wallet(p_admin_wallet_address) THEN
    RAISE EXCEPTION 'Unauthorized: not an admin wallet';
  END IF;

  -- Deactivate any currently active season
  UPDATE public.pvp_seasons SET is_active = false, updated_at = now()
  WHERE is_active = true;

  -- Get next season number
  SELECT COALESCE(MAX(season_number), 0) + 1 INTO v_new_season_number FROM public.pvp_seasons;

  v_starts_at := now();
  v_ends_at := now() + (p_duration_days || ' days')::interval;

  INSERT INTO public.pvp_seasons (season_number, name, starts_at, ends_at, is_active, rewards_config, league_rewards_config)
  VALUES (v_new_season_number, p_name, v_starts_at, v_ends_at, true, p_rewards_config, p_league_rewards_config)
  RETURNING id INTO v_season_id;

  RETURN jsonb_build_object(
    'success', true,
    'season_id', v_season_id,
    'season_number', v_new_season_number,
    'starts_at', v_starts_at,
    'ends_at', v_ends_at
  );
END;
$$;

-- Update admin_update_pvp_season to accept league_rewards_config
CREATE OR REPLACE FUNCTION public.admin_update_pvp_season(
  p_admin_wallet_address text,
  p_season_id uuid,
  p_name text DEFAULT NULL,
  p_ends_at timestamptz DEFAULT NULL,
  p_rewards_config jsonb DEFAULT NULL,
  p_league_rewards_config jsonb DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify admin
  IF NOT public.is_admin_or_super_wallet(p_admin_wallet_address) THEN
    RAISE EXCEPTION 'Unauthorized: not an admin wallet';
  END IF;

  UPDATE public.pvp_seasons
  SET
    name = COALESCE(p_name, name),
    ends_at = COALESCE(p_ends_at, ends_at),
    rewards_config = COALESCE(p_rewards_config, rewards_config),
    league_rewards_config = COALESCE(p_league_rewards_config, league_rewards_config),
    updated_at = now()
  WHERE id = p_season_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- Update admin_distribute_season_rewards to also distribute league rewards
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
  v_league_rewards_config jsonb;
  v_tier_key text;
  v_tier_config jsonb;
  v_tier_reward_amount numeric := 0;
  v_league_reward_amount numeric := 0;
  v_total_reward numeric := 0;
  v_players_rewarded integer := 0;
  v_total_ell_distributed numeric := 0;
  v_total_league_ell_distributed numeric := 0;
  v_max_league integer;
BEGIN
  -- Verify admin
  IF NOT public.is_admin_or_super_wallet(p_admin_wallet_address) THEN
    RAISE EXCEPTION 'Unauthorized: not an admin wallet';
  END IF;

  -- Get season
  SELECT * INTO v_season FROM public.pvp_seasons WHERE id = p_season_id;
  IF v_season IS NULL THEN
    RAISE EXCEPTION 'Season not found';
  END IF;

  IF v_season.rewards_distributed = true THEN
    RAISE EXCEPTION 'Rewards already distributed for this season';
  END IF;

  v_rewards_config := v_season.rewards_config;
  v_league_rewards_config := COALESCE(v_season.league_rewards_config, '{}'::jsonb);

  -- Iterate through all players in this season
  FOR v_player IN
    SELECT wallet_address, elo, tier
    FROM public.pvp_ratings
    WHERE season_id = p_season_id
      AND wallet_address NOT LIKE 'BOT_%'
  LOOP
    v_tier_reward_amount := 0;
    v_league_reward_amount := 0;

    -- Find tier reward based on Elo
    FOR v_tier_key IN SELECT jsonb_object_keys(v_rewards_config)
    LOOP
      v_tier_config := v_rewards_config -> v_tier_key;
      IF v_player.elo >= (v_tier_config ->> 'min_elo')::int
        AND v_player.elo <= (v_tier_config ->> 'max_elo')::int THEN
        v_tier_reward_amount := COALESCE((v_tier_config ->> 'ell_reward')::numeric, 0);
        EXIT;
      END IF;
    END LOOP;

    -- Find highest league played from pvp_matches
    SELECT MAX(rarity_tier) INTO v_max_league
    FROM public.pvp_matches
    WHERE season_id = p_season_id
      AND (player1_wallet = v_player.wallet_address OR player2_wallet = v_player.wallet_address)
      AND status = 'completed';

    -- Find league reward based on highest league
    IF v_max_league IS NOT NULL AND v_league_rewards_config ? v_max_league::text THEN
      v_league_reward_amount := COALESCE(
        (v_league_rewards_config -> v_max_league::text ->> 'ell_reward')::numeric, 0
      );
    END IF;

    v_total_reward := v_tier_reward_amount + v_league_reward_amount;

    -- Distribute combined reward
    IF v_total_reward > 0 THEN
      PERFORM public.add_ell_balance(v_player.wallet_address, v_total_reward);
      v_players_rewarded := v_players_rewarded + 1;
      v_total_ell_distributed := v_total_ell_distributed + v_tier_reward_amount;
      v_total_league_ell_distributed := v_total_league_ell_distributed + v_league_reward_amount;
    END IF;
  END LOOP;

  -- Mark as distributed
  UPDATE public.pvp_seasons
  SET rewards_distributed = true, updated_at = now()
  WHERE id = p_season_id;

  RETURN jsonb_build_object(
    'success', true,
    'players_rewarded', v_players_rewarded,
    'total_ell_distributed', v_total_ell_distributed,
    'total_league_ell_distributed', v_total_league_ell_distributed,
    'total_combined', v_total_ell_distributed + v_total_league_ell_distributed
  );
END;
$$;
