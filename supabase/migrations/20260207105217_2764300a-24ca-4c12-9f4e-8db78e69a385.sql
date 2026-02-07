
-- 1. Add rarity_tier column to pvp_ratings
ALTER TABLE public.pvp_ratings 
ADD COLUMN IF NOT EXISTS rarity_tier integer NOT NULL DEFAULT 1;

-- 2. Drop old unique constraint and create new one with rarity_tier
ALTER TABLE public.pvp_ratings 
DROP CONSTRAINT IF EXISTS pvp_ratings_wallet_address_season_id_key;

ALTER TABLE public.pvp_ratings 
ADD CONSTRAINT pvp_ratings_wallet_address_season_id_rarity_tier_key 
UNIQUE (wallet_address, season_id, rarity_tier);

-- 3. Update get_or_create_pvp_rating to accept rarity_tier
CREATE OR REPLACE FUNCTION public.get_or_create_pvp_rating(
  p_wallet_address text,
  p_rarity_tier integer DEFAULT 1
)
RETURNS TABLE(
  id uuid, 
  wallet_address text, 
  season_id uuid, 
  elo integer, 
  tier text, 
  wins integer, 
  losses integer, 
  win_streak integer, 
  best_win_streak integer, 
  matches_played integer,
  rarity_tier integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_season_id uuid;
  v_rating_id uuid;
BEGIN
  SELECT get_active_pvp_season() INTO v_season_id;
  
  IF v_season_id IS NULL THEN
    RAISE EXCEPTION 'No active PvP season found';
  END IF;
  
  SELECT r.id INTO v_rating_id
  FROM public.pvp_ratings r
  WHERE r.wallet_address = p_wallet_address 
    AND r.season_id = v_season_id
    AND r.rarity_tier = p_rarity_tier;
  
  IF v_rating_id IS NULL THEN
    INSERT INTO public.pvp_ratings (wallet_address, season_id, elo, tier, wins, losses, rarity_tier)
    VALUES (p_wallet_address, v_season_id, 1000, 'bronze', 0, 0, p_rarity_tier)
    RETURNING pvp_ratings.id INTO v_rating_id;
  END IF;
  
  RETURN QUERY
  SELECT r.id, r.wallet_address, r.season_id, r.elo, r.tier, 
         r.wins, r.losses, r.win_streak, r.best_win_streak, r.matches_played,
         r.rarity_tier
  FROM public.pvp_ratings r
  WHERE r.id = v_rating_id;
END;
$function$;

-- 4. Drop old update_pvp_elo overloads and recreate with rarity_tier support
-- Drop the 3-param version first
DROP FUNCTION IF EXISTS public.update_pvp_elo(text, text, integer);

-- Drop the 2-param version
DROP FUNCTION IF EXISTS public.update_pvp_elo(text, text);

-- Recreate the main version with rarity_tier
CREATE OR REPLACE FUNCTION public.update_pvp_elo(
  p_winner_wallet text, 
  p_loser_wallet text,
  p_rarity_tier integer DEFAULT 1
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_season_id uuid;
  v_winner_elo integer;
  v_loser_elo integer;
  v_winner_k integer;
  v_loser_k integer;
  v_expected_win double precision;
  v_winner_gain integer;
  v_loser_loss integer;
  v_elo_change integer;
  v_is_bot_winner boolean := false;
  v_is_bot_loser boolean := false;
BEGIN
  SELECT get_active_pvp_season() INTO v_season_id;
  
  IF v_season_id IS NULL THEN
    RAISE NOTICE 'No active PvP season found, skipping ELO update';
    RETURN 0;
  END IF;

  v_is_bot_winner := (p_winner_wallet IS NULL OR p_winner_wallet LIKE 'BOT_%' OR p_winner_wallet = 'SKIP_BOT');
  v_is_bot_loser := (p_loser_wallet IS NULL OR p_loser_wallet LIKE 'BOT_%' OR p_loser_wallet = 'SKIP_BOT');

  IF v_is_bot_winner AND v_is_bot_loser THEN
    RETURN 0;
  END IF;

  -- Ensure rating records exist for real players (with rarity_tier)
  IF NOT v_is_bot_winner THEN
    INSERT INTO public.pvp_ratings (wallet_address, season_id, elo, tier, wins, losses, win_streak, best_win_streak, matches_played, rarity_tier)
    VALUES (p_winner_wallet, v_season_id, 1000, 'bronze', 0, 0, 0, 0, 0, p_rarity_tier)
    ON CONFLICT (wallet_address, season_id, rarity_tier) DO NOTHING;
  END IF;

  IF NOT v_is_bot_loser THEN
    INSERT INTO public.pvp_ratings (wallet_address, season_id, elo, tier, wins, losses, win_streak, best_win_streak, matches_played, rarity_tier)
    VALUES (p_loser_wallet, v_season_id, 1000, 'bronze', 0, 0, 0, 0, 0, p_rarity_tier)
    ON CONFLICT (wallet_address, season_id, rarity_tier) DO NOTHING;
  END IF;

  -- Get current Elo values (use 1000 for bots)
  IF v_is_bot_winner THEN
    v_winner_elo := 1000;
  ELSE
    SELECT elo INTO v_winner_elo FROM public.pvp_ratings
    WHERE wallet_address = p_winner_wallet AND season_id = v_season_id AND rarity_tier = p_rarity_tier;
  END IF;

  IF v_is_bot_loser THEN
    v_loser_elo := 1000;
  ELSE
    SELECT elo INTO v_loser_elo FROM public.pvp_ratings
    WHERE wallet_address = p_loser_wallet AND season_id = v_season_id AND rarity_tier = p_rarity_tier;
  END IF;

  -- K-factor
  IF v_winner_elo >= 2000 THEN v_winner_k := 16;
  ELSIF v_winner_elo >= 1600 THEN v_winner_k := 24;
  ELSE v_winner_k := 32;
  END IF;

  IF v_loser_elo >= 2000 THEN v_loser_k := 16;
  ELSIF v_loser_elo >= 1600 THEN v_loser_k := 24;
  ELSE v_loser_k := 32;
  END IF;

  IF v_is_bot_winner OR v_is_bot_loser THEN
    v_winner_k := 32;
    v_loser_k := 32;
  END IF;

  v_expected_win := 1.0 / (1.0 + power(10.0, (v_loser_elo - v_winner_elo)::double precision / 400.0));
  v_winner_gain := GREATEST(1, round(v_winner_k * (1.0 - v_expected_win))::integer);
  v_loser_loss := GREATEST(1, round(v_loser_k * v_expected_win)::integer);
  v_elo_change := GREATEST(1, round((v_winner_gain + v_loser_loss)::double precision / 2.0)::integer);

  -- Update winner stats
  IF NOT v_is_bot_winner THEN
    UPDATE public.pvp_ratings
    SET 
      elo = elo + v_winner_gain,
      wins = wins + 1,
      matches_played = matches_played + 1,
      win_streak = win_streak + 1,
      best_win_streak = GREATEST(best_win_streak, win_streak + 1),
      tier = get_elo_tier(elo + v_winner_gain),
      updated_at = now()
    WHERE wallet_address = p_winner_wallet AND season_id = v_season_id AND rarity_tier = p_rarity_tier;
  END IF;

  -- Update loser stats
  IF NOT v_is_bot_loser THEN
    UPDATE public.pvp_ratings
    SET 
      elo = GREATEST(0, elo - v_loser_loss),
      losses = losses + 1,
      matches_played = matches_played + 1,
      win_streak = 0,
      tier = get_elo_tier(GREATEST(0, elo - v_loser_loss)),
      updated_at = now()
    WHERE wallet_address = p_loser_wallet AND season_id = v_season_id AND rarity_tier = p_rarity_tier;
  END IF;

  RETURN v_elo_change;
END;
$function$;

-- 5. Update get_pvp_season_leaderboard to accept rarity_tier
CREATE OR REPLACE FUNCTION public.get_pvp_season_leaderboard(
  p_season_id uuid, 
  p_limit integer DEFAULT 50,
  p_rarity_tier integer DEFAULT NULL
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
  best_win_streak integer,
  rarity_tier integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
    r.best_win_streak,
    r.rarity_tier
  FROM public.pvp_ratings r
  WHERE r.season_id = p_season_id
    AND r.wallet_address NOT LIKE 'BOT_%'
    AND (p_rarity_tier IS NULL OR r.rarity_tier = p_rarity_tier)
  ORDER BY r.elo DESC, r.wins DESC
  LIMIT p_limit;
END;
$function$;

-- 6. Update admin_distribute_season_rewards for per-league ratings
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
  v_player record;
  v_rewards_config jsonb;
  v_league_rewards_config jsonb;
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

      -- Find tier reward based on Elo for this league's rating
      FOR v_tier_key IN SELECT jsonb_object_keys(v_rewards_config)
      LOOP
        v_tier_config := v_rewards_config -> v_tier_key;
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
