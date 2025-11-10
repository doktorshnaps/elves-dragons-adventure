-- Добавляем версионирование в game_data для защиты от race conditions
ALTER TABLE public.game_data ADD COLUMN IF NOT EXISTS data_version INTEGER DEFAULT 1;

-- Создаём индекс для быстрого поиска по версии
CREATE INDEX IF NOT EXISTS idx_game_data_version ON public.game_data(wallet_address, data_version);

-- Создаём защищённую версию RPC с версионированием и проверкой пустых апдейтов
CREATE OR REPLACE FUNCTION public.update_game_data_by_wallet_v2(
  p_wallet_address text,
  p_balance integer DEFAULT NULL,
  p_cards jsonb DEFAULT NULL,
  p_selected_team jsonb DEFAULT NULL,
  p_dragon_eggs jsonb DEFAULT NULL,
  p_account_level integer DEFAULT NULL,
  p_account_experience integer DEFAULT NULL,
  p_initialized boolean DEFAULT NULL,
  p_marketplace_listings jsonb DEFAULT NULL,
  p_social_quests jsonb DEFAULT NULL,
  p_adventure_player_stats jsonb DEFAULT NULL,
  p_adventure_current_monster jsonb DEFAULT NULL,
  p_battle_state jsonb DEFAULT NULL,
  p_barracks_upgrades jsonb DEFAULT NULL,
  p_dragon_lair_upgrades jsonb DEFAULT NULL,
  p_active_workers jsonb DEFAULT NULL,
  p_building_levels jsonb DEFAULT NULL,
  p_active_building_upgrades jsonb DEFAULT NULL,
  p_wood integer DEFAULT NULL,
  p_stone integer DEFAULT NULL,
  p_iron integer DEFAULT NULL,
  p_gold integer DEFAULT NULL,
  p_max_wood integer DEFAULT NULL,
  p_max_stone integer DEFAULT NULL,
  p_max_iron integer DEFAULT NULL,
  p_wood_last_collection_time bigint DEFAULT NULL,
  p_stone_last_collection_time bigint DEFAULT NULL,
  p_wood_production_data jsonb DEFAULT NULL,
  p_stone_production_data jsonb DEFAULT NULL,
  p_expected_version integer DEFAULT NULL,
  p_force boolean DEFAULT false
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_current_version integer;
  v_current_balance integer;
  v_current_cards_count integer;
  v_new_cards_count integer;
  v_has_changes boolean := false;
BEGIN
  IF p_wallet_address IS NULL OR length(trim(p_wallet_address)) = 0 THEN
    RAISE EXCEPTION 'wallet address required';
  END IF;

  -- Получаем текущую версию и критичные данные
  SELECT 
    data_version,
    balance,
    COALESCE(jsonb_array_length(cards), 0)
  INTO 
    v_current_version,
    v_current_balance,
    v_current_cards_count
  FROM public.game_data
  WHERE wallet_address = p_wallet_address;

  -- Если записи нет, создаём её
  IF v_current_version IS NULL THEN
    PERFORM public.ensure_game_data_exists(p_wallet_address);
    v_current_version := 1;
    v_current_cards_count := 0;
    v_current_balance := 0;
  END IF;

  -- Проверка версии (если указана)
  IF p_expected_version IS NOT NULL AND v_current_version != p_expected_version THEN
    RAISE LOG 'Version conflict for wallet %: expected %, got %', p_wallet_address, p_expected_version, v_current_version;
    RETURN false;
  END IF;

  -- ЗАЩИТА: проверяем, не пытаются ли стереть критичные данные без force
  IF NOT COALESCE(p_force, false) THEN
    -- Проверка: если присылают пустой массив cards, но у нас есть карты
    IF p_cards IS NOT NULL THEN
      v_new_cards_count := COALESCE(jsonb_array_length(p_cards), 0);
      IF v_new_cards_count = 0 AND v_current_cards_count > 0 THEN
        RAISE LOG 'BLOCKED: Attempt to clear % cards for wallet % without force flag', v_current_cards_count, p_wallet_address;
        RETURN false;
      END IF;
    END IF;

    -- Проверка: если присылают balance=0, но у нас есть баланс
    IF p_balance IS NOT NULL AND p_balance = 0 AND v_current_balance > 0 THEN
      RAISE LOG 'BLOCKED: Attempt to zero balance (was %) for wallet % without force flag', v_current_balance, p_wallet_address;
      RETURN false;
    END IF;
  END IF;

  -- Обновляем только переданные поля (partial update)
  UPDATE public.game_data
  SET
    balance = COALESCE(p_balance, balance),
    cards = COALESCE(p_cards, cards),
    selected_team = COALESCE(p_selected_team, selected_team),
    dragon_eggs = COALESCE(p_dragon_eggs, dragon_eggs),
    account_level = COALESCE(p_account_level, account_level),
    account_experience = COALESCE(p_account_experience, account_experience),
    initialized = COALESCE(p_initialized, initialized),
    marketplace_listings = COALESCE(p_marketplace_listings, marketplace_listings),
    social_quests = COALESCE(p_social_quests, social_quests),
    adventure_player_stats = COALESCE(p_adventure_player_stats, adventure_player_stats),
    adventure_current_monster = COALESCE(p_adventure_current_monster, adventure_current_monster),
    battle_state = COALESCE(p_battle_state, battle_state),
    barracks_upgrades = COALESCE(p_barracks_upgrades, barracks_upgrades),
    dragon_lair_upgrades = COALESCE(p_dragon_lair_upgrades, dragon_lair_upgrades),
    active_workers = COALESCE(p_active_workers, active_workers),
    building_levels = COALESCE(p_building_levels, building_levels),
    active_building_upgrades = COALESCE(p_active_building_upgrades, active_building_upgrades),
    wood = COALESCE(p_wood, wood),
    stone = COALESCE(p_stone, stone),
    iron = COALESCE(p_iron, iron),
    gold = COALESCE(p_gold, gold),
    max_wood = COALESCE(p_max_wood, max_wood),
    max_stone = COALESCE(p_max_stone, max_stone),
    max_iron = COALESCE(p_max_iron, max_iron),
    wood_last_collection_time = COALESCE(p_wood_last_collection_time, wood_last_collection_time),
    stone_last_collection_time = COALESCE(p_stone_last_collection_time, stone_last_collection_time),
    wood_production_data = COALESCE(p_wood_production_data, wood_production_data),
    stone_production_data = COALESCE(p_stone_production_data, stone_production_data),
    data_version = data_version + 1,
    updated_at = now()
  WHERE wallet_address = p_wallet_address;

  RAISE LOG 'Updated game_data for wallet %, version % -> %', p_wallet_address, v_current_version, v_current_version + 1;
  RETURN true;
END;
$function$;