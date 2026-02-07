
-- Update admin_distribute_season_rewards to support per-league rewards_config
-- New format: { "1": { "bronze": {...}, ... }, "2": {...}, ... }
-- Backward compat: if keys are tier names (bronze, silver...), use flat config for all leagues
CREATE OR REPLACE FUNCTION public.admin_distribute_season_rewards(
  p_admin_wallet_address text, 
  p_season_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_season record;
  v_rewards_config jsonb;
  v_league_rewards_config jsonb;
  v_is_per_league boolean;
  v_current_tier_rewards jsonb;
  v_tier_key text;
  v_tier_config jsonb;
  v_tier_reward_amount numeric := 0;
  v_league_reward_amount numeric := 0;
  v_player_total numeric := 0;
  v_players_rewarded integer := 0;
  v_total_ell_distributed numeric := 0;
  v_total_league_ell_distributed numeric := 0;
  v_player_wallets text[];
  v_wallet text;
  v_rating record;
BEGIN
  IF NOT public.is_admin_or_super_wallet(p_admin_wallet_address) THEN
    RAISE EXCEPTION 'Unauthorized: not an admin wallet';
  END IF;

  SELECT * INTO v_season FROM public.pvp_seasons WHERE id = p_season_id;
  IF v_season IS NULL THEN
    RAISE EXCEPTION 'Season not found';
  END IF;

  IF v_season.rewards_distributed = true THEN
    RAISE EXCEPTION 'Rewards already distributed for this season';
  END IF;

  v_rewards_config := v_season.rewards_config;
  v_league_rewards_config := COALESCE(v_season.league_rewards_config, '{}'::jsonb);

  -- Detect per-league format: if any top-level key is a digit (1-8), it's per-league
  v_is_per_league := (
    SELECT EXISTS(
      SELECT 1 FROM jsonb_object_keys(v_rewards_config) k
      WHERE k ~ '^\d+$'
    )
  );

  -- Get unique player wallets
  SELECT ARRAY_AGG(DISTINCT wallet_address) INTO v_player_wallets
  FROM public.pvp_ratings
  WHERE season_id = p_season_id
    AND wallet_address NOT LIKE 'BOT_%';

  IF v_player_wallets IS NULL THEN
    UPDATE public.pvp_seasons
    SET rewards_distributed = true, updated_at = now()
    WHERE id = p_season_id;

    RETURN jsonb_build_object(
      'success', true,
      'players_rewarded', 0,
      'total_ell_distributed', 0,
      'total_league_ell_distributed', 0,
      'total_combined', 0
    );
  END IF;

  -- For each unique player, sum rewards from all their league ratings
  FOREACH v_wallet IN ARRAY v_player_wallets
  LOOP
    v_player_total := 0;

    -- Iterate all rating records for this player in this season (one per league)
    FOR v_rating IN
      SELECT elo, tier, rarity_tier
      FROM public.pvp_ratings
      WHERE season_id = p_season_id
        AND wallet_address = v_wallet
    LOOP
      v_tier_reward_amount := 0;
      v_league_reward_amount := 0;

      -- Select the correct tier config based on format
      IF v_is_per_league AND v_rewards_config ? v_rating.rarity_tier::text THEN
        v_current_tier_rewards := v_rewards_config -> v_rating.rarity_tier::text;
      ELSE
        -- Flat format (backward compatibility)
        v_current_tier_rewards := v_rewards_config;
      END IF;

      -- Find tier reward based on Elo for this league's rating
      FOR v_tier_key IN SELECT jsonb_object_keys(v_current_tier_rewards)
      LOOP
        v_tier_config := v_current_tier_rewards -> v_tier_key;
        IF v_rating.elo >= (v_tier_config ->> 'min_elo')::int
          AND v_rating.elo <= (v_tier_config ->> 'max_elo')::int THEN
          v_tier_reward_amount := COALESCE((v_tier_config ->> 'ell_reward')::numeric, 0);
          EXIT;
        END IF;
      END LOOP;

      -- Find league reward for this league
      IF v_league_rewards_config ? v_rating.rarity_tier::text THEN
        v_league_reward_amount := COALESCE(
          (v_league_rewards_config -> v_rating.rarity_tier::text ->> 'ell_reward')::numeric, 0
        );
      END IF;

      v_player_total := v_player_total + v_tier_reward_amount + v_league_reward_amount;
      v_total_ell_distributed := v_total_ell_distributed + v_tier_reward_amount;
      v_total_league_ell_distributed := v_total_league_ell_distributed + v_league_reward_amount;
    END LOOP;

    IF v_player_total > 0 THEN
      PERFORM public.add_ell_balance(v_wallet, v_player_total);
      v_players_rewarded := v_players_rewarded + 1;
    END IF;
  END LOOP;

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
$function$;
