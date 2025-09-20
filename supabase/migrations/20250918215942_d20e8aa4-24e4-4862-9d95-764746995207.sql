-- Fix infinite errors: ensure user_id is set on game_data creation and avoid duplicate card_instances

-- 1) Update create_game_data_by_wallet to always set user_id
CREATE OR REPLACE FUNCTION public.create_game_data_by_wallet(p_wallet_address text)
RETURNS TABLE(
  user_id uuid,
  balance integer,
  cards jsonb,
  inventory jsonb,
  selected_team jsonb,
  dragon_eggs jsonb,
  account_level integer,
  account_experience integer,
  initialized boolean,
  marketplace_listings jsonb,
  social_quests jsonb,
  adventure_player_stats jsonb,
  adventure_current_monster jsonb,
  battle_state jsonb,
  barracks_upgrades jsonb,
  dragon_lair_upgrades jsonb,
  active_workers jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_record RECORD;
  v_user_id uuid;
BEGIN
  IF p_wallet_address IS NULL OR length(trim(p_wallet_address)) = 0 THEN
    RAISE EXCEPTION 'wallet address required';
  END IF;

  -- Check if record already exists
  SELECT * INTO new_record
  FROM public.game_data gd
  WHERE gd.wallet_address = p_wallet_address
  LIMIT 1;

  IF new_record IS NOT NULL THEN
    -- Return existing record
    RETURN QUERY
    SELECT 
      new_record.user_id,
      new_record.balance,
      new_record.cards,
      new_record.inventory,
      new_record.selected_team,
      new_record.dragon_eggs,
      new_record.account_level,
      new_record.account_experience,
      new_record.initialized,
      new_record.marketplace_listings,
      new_record.social_quests,
      new_record.adventure_player_stats,
      new_record.adventure_current_monster,
      new_record.battle_state,
      new_record.barracks_upgrades,
      new_record.dragon_lair_upgrades,
      new_record.active_workers;
  ELSE
    -- Create new user_id and record with default values
    v_user_id := gen_random_uuid();

    INSERT INTO public.game_data (
      user_id,
      wallet_address,
      balance,
      cards,
      inventory,
      selected_team,
      dragon_eggs,
      account_level,
      account_experience,
      initialized,
      marketplace_listings,
      social_quests,
      adventure_player_stats,
      adventure_current_monster,
      battle_state,
      barracks_upgrades,
      dragon_lair_upgrades,
      active_workers
    ) VALUES (
      v_user_id,
      p_wallet_address,
      0, -- default balance
      '[]'::jsonb, -- empty cards array
      '[]'::jsonb, -- empty inventory
      '[]'::jsonb, -- empty selected team
      '[]'::jsonb, -- empty dragon eggs
      1, -- starting level
      0, -- starting experience
      false, -- not initialized
      '[]'::jsonb, -- empty marketplace listings
      '[]'::jsonb, -- empty social quests
      NULL, -- no adventure stats
      NULL, -- no current monster
      NULL, -- no battle state
      '[]'::jsonb, -- empty barracks upgrades
      '[]'::jsonb, -- empty dragon lair upgrades
      '[]'::jsonb -- empty active workers
    ) RETURNING * INTO new_record;

    -- Return the new record
    RETURN QUERY
    SELECT 
      new_record.user_id,
      new_record.balance,
      new_record.cards,
      new_record.inventory,
      new_record.selected_team,
      new_record.dragon_eggs,
      new_record.account_level,
      new_record.account_experience,
      new_record.initialized,
      new_record.marketplace_listings,
      new_record.social_quests,
      new_record.adventure_player_stats,
      new_record.adventure_current_monster,
      new_record.battle_state,
      new_record.barracks_upgrades,
      new_record.dragon_lair_upgrades,
      new_record.active_workers;
  END IF;
END;
$$;

-- 2) Make create_card_instance_by_wallet idempotent to avoid duplicates
CREATE OR REPLACE FUNCTION public.create_card_instance_by_wallet(p_wallet_address text, p_card jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_existing uuid;
  v_new_id uuid;
  v_card_id text := p_card->>'id';
  v_card_type text := COALESCE(NULLIF(p_card->>'type',''), 'hero');
  v_health integer := COALESCE((p_card->>'health')::integer, 0);
BEGIN
  IF p_wallet_address IS NULL OR length(trim(p_wallet_address)) = 0 THEN
    RAISE EXCEPTION 'wallet address required';
  END IF;
  IF v_card_id IS NULL OR v_card_id = '' THEN
    RAISE EXCEPTION 'card id required';
  END IF;

  -- Try to find existing
  SELECT id INTO v_existing
  FROM public.card_instances
  WHERE wallet_address = p_wallet_address
    AND card_template_id = v_card_id
  LIMIT 1;

  IF v_existing IS NOT NULL THEN
    RETURN v_existing;
  END IF;

  -- Insert or do nothing if concurrent insert happened
  INSERT INTO public.card_instances (
    wallet_address,
    user_id,
    card_template_id,
    card_type,
    current_health,
    max_health,
    last_heal_time,
    card_data
  ) VALUES (
    p_wallet_address,
    NULL,
    v_card_id,
    CASE WHEN v_card_type = 'pet' THEN 'dragon' ELSE 'hero' END,
    v_health,
    v_health,
    now(),
    p_card
  )
  ON CONFLICT (wallet_address, card_template_id) DO NOTHING
  RETURNING id INTO v_new_id;

  IF v_new_id IS NULL THEN
    -- Concurrent insert: fetch the id
    SELECT id INTO v_new_id
    FROM public.card_instances
    WHERE wallet_address = p_wallet_address
      AND card_template_id = v_card_id
    LIMIT 1;
  END IF;

  RETURN v_new_id;
END;
$$;