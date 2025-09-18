-- Update functions to include active_workers parameter
CREATE OR REPLACE FUNCTION public.update_game_data_by_wallet(
  p_wallet_address text, 
  p_balance integer DEFAULT NULL::integer, 
  p_cards jsonb DEFAULT NULL::jsonb, 
  p_inventory jsonb DEFAULT NULL::jsonb, 
  p_selected_team jsonb DEFAULT NULL::jsonb, 
  p_dragon_eggs jsonb DEFAULT NULL::jsonb, 
  p_account_level integer DEFAULT NULL::integer, 
  p_account_experience integer DEFAULT NULL::integer, 
  p_initialized boolean DEFAULT NULL::boolean, 
  p_marketplace_listings jsonb DEFAULT NULL::jsonb, 
  p_social_quests jsonb DEFAULT NULL::jsonb, 
  p_adventure_player_stats jsonb DEFAULT NULL::jsonb, 
  p_adventure_current_monster jsonb DEFAULT NULL::jsonb, 
  p_battle_state jsonb DEFAULT NULL::jsonb, 
  p_barracks_upgrades jsonb DEFAULT NULL::jsonb, 
  p_dragon_lair_upgrades jsonb DEFAULT NULL::jsonb,
  p_active_workers jsonb DEFAULT NULL::jsonb
)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  update_data jsonb := '{}';
BEGIN
  IF p_wallet_address IS NULL OR length(trim(p_wallet_address)) = 0 THEN
    RAISE EXCEPTION 'wallet address required';
  END IF;

  -- Build update object only with provided values
  IF p_balance IS NOT NULL THEN
    update_data := update_data || jsonb_build_object('balance', p_balance);
  END IF;
  
  IF p_cards IS NOT NULL THEN
    update_data := update_data || jsonb_build_object('cards', p_cards);
  END IF;
  
  IF p_inventory IS NOT NULL THEN
    update_data := update_data || jsonb_build_object('inventory', p_inventory);
  END IF;
  
  IF p_selected_team IS NOT NULL THEN
    update_data := update_data || jsonb_build_object('selected_team', p_selected_team);
  END IF;
  
  IF p_dragon_eggs IS NOT NULL THEN
    update_data := update_data || jsonb_build_object('dragon_eggs', p_dragon_eggs);
  END IF;
  
  IF p_account_level IS NOT NULL THEN
    update_data := update_data || jsonb_build_object('account_level', p_account_level);
  END IF;
  
  IF p_account_experience IS NOT NULL THEN
    update_data := update_data || jsonb_build_object('account_experience', p_account_experience);
  END IF;
  
  IF p_initialized IS NOT NULL THEN
    update_data := update_data || jsonb_build_object('initialized', p_initialized);
  END IF;
  
  IF p_marketplace_listings IS NOT NULL THEN
    update_data := update_data || jsonb_build_object('marketplace_listings', p_marketplace_listings);
  END IF;
  
  IF p_social_quests IS NOT NULL THEN
    update_data := update_data || jsonb_build_object('social_quests', p_social_quests);
  END IF;
  
  IF p_adventure_player_stats IS NOT NULL THEN
    update_data := update_data || jsonb_build_object('adventure_player_stats', p_adventure_player_stats);
  END IF;
  
  IF p_adventure_current_monster IS NOT NULL THEN
    update_data := update_data || jsonb_build_object('adventure_current_monster', p_adventure_current_monster);
  END IF;
  
  IF p_battle_state IS NOT NULL THEN
    update_data := update_data || jsonb_build_object('battle_state', p_battle_state);
  END IF;
  
  IF p_barracks_upgrades IS NOT NULL THEN
    update_data := update_data || jsonb_build_object('barracks_upgrades', p_barracks_upgrades);
  END IF;
  
  IF p_dragon_lair_upgrades IS NOT NULL THEN
    update_data := update_data || jsonb_build_object('dragon_lair_upgrades', p_dragon_lair_upgrades);
  END IF;
  
  IF p_active_workers IS NOT NULL THEN
    update_data := update_data || jsonb_build_object('active_workers', p_active_workers);
  END IF;

  -- Update the record
  UPDATE public.game_data 
  SET 
    balance = COALESCE((update_data->>'balance')::integer, balance),
    cards = COALESCE((update_data->'cards'), cards),
    inventory = COALESCE((update_data->'inventory'), inventory),
    selected_team = COALESCE((update_data->'selected_team'), selected_team),
    dragon_eggs = COALESCE((update_data->'dragon_eggs'), dragon_eggs),
    account_level = COALESCE((update_data->>'account_level')::integer, account_level),
    account_experience = COALESCE((update_data->>'account_experience')::integer, account_experience),
    initialized = COALESCE((update_data->>'initialized')::boolean, initialized),
    marketplace_listings = COALESCE((update_data->'marketplace_listings'), marketplace_listings),
    social_quests = COALESCE((update_data->'social_quests'), social_quests),
    adventure_player_stats = COALESCE((update_data->'adventure_player_stats'), adventure_player_stats),
    adventure_current_monster = COALESCE((update_data->'adventure_current_monster'), adventure_current_monster),
    battle_state = COALESCE((update_data->'battle_state'), battle_state),
    barracks_upgrades = COALESCE((update_data->'barracks_upgrades'), barracks_upgrades),
    dragon_lair_upgrades = COALESCE((update_data->'dragon_lair_upgrades'), dragon_lair_upgrades),
    active_workers = COALESCE((update_data->'active_workers'), active_workers),
    updated_at = now()
  WHERE wallet_address = p_wallet_address;

  RETURN FOUND;
END;
$function$;

-- Update get_game_data_by_wallet function to return active_workers
CREATE OR REPLACE FUNCTION public.get_game_data_by_wallet(p_wallet_address text)
 RETURNS TABLE(user_id uuid, balance integer, cards jsonb, inventory jsonb, selected_team jsonb, dragon_eggs jsonb, account_level integer, account_experience integer, initialized boolean, marketplace_listings jsonb, social_quests jsonb, adventure_player_stats jsonb, adventure_current_monster jsonb, battle_state jsonb, barracks_upgrades jsonb, dragon_lair_upgrades jsonb, active_workers jsonb)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF p_wallet_address IS NULL OR length(trim(p_wallet_address)) = 0 THEN
    RAISE EXCEPTION 'wallet address required';
  END IF;

  -- First try to get existing data
  RETURN QUERY
  SELECT 
    gd.user_id,
    gd.balance,
    gd.cards,
    gd.inventory,
    gd.selected_team,
    gd.dragon_eggs,
    gd.account_level,
    gd.account_experience,
    gd.initialized,
    gd.marketplace_listings,
    gd.social_quests,
    gd.adventure_player_stats,
    gd.adventure_current_monster,
    gd.battle_state,
    gd.barracks_upgrades,
    gd.dragon_lair_upgrades,
    gd.active_workers
  FROM public.game_data gd
  WHERE gd.wallet_address = p_wallet_address
  LIMIT 1;

  -- If no data found, create it
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT * FROM public.create_game_data_by_wallet(p_wallet_address);
  END IF;
END;
$function$;

-- Update create_game_data_by_wallet function to include active_workers
CREATE OR REPLACE FUNCTION public.create_game_data_by_wallet(p_wallet_address text)
 RETURNS TABLE(user_id uuid, balance integer, cards jsonb, inventory jsonb, selected_team jsonb, dragon_eggs jsonb, account_level integer, account_experience integer, initialized boolean, marketplace_listings jsonb, social_quests jsonb, adventure_player_stats jsonb, adventure_current_monster jsonb, battle_state jsonb, barracks_upgrades jsonb, dragon_lair_upgrades jsonb, active_workers jsonb)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  new_record RECORD;
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
    -- Create new record with default values
    INSERT INTO public.game_data (
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
$function$;