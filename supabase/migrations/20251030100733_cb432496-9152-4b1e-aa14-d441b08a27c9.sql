-- Fix RPC ambiguity by introducing a single canonical function name used by the client
-- Create SECURE, defaulted-args function to update game_data by wallet

create or replace function public.update_game_data_by_wallet_v2(
  p_wallet_address text,
  p_balance integer default null,
  p_cards jsonb default null,
  p_inventory jsonb default null,
  p_selected_team jsonb default null,
  p_dragon_eggs jsonb default null,
  p_account_level integer default null,
  p_account_experience integer default null,
  p_initialized boolean default null,
  p_marketplace_listings jsonb default null,
  p_social_quests jsonb default null,
  p_adventure_player_stats jsonb default null,
  p_adventure_current_monster jsonb default null,
  p_battle_state jsonb default null,
  p_barracks_upgrades jsonb default null,
  p_dragon_lair_upgrades jsonb default null,
  p_active_workers jsonb default null,
  p_building_levels jsonb default null,
  p_active_building_upgrades jsonb default null,
  p_wood integer default null,
  p_stone integer default null,
  p_iron integer default null,
  p_gold integer default null,
  p_max_wood integer default null,
  p_max_stone integer default null,
  p_max_iron integer default null,
  p_wood_last_collection_time bigint default null,
  p_stone_last_collection_time bigint default null,
  p_wood_production_data jsonb default null,
  p_stone_production_data jsonb default null
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.game_data
  set
    balance = coalesce(p_balance, balance),
    cards = coalesce(p_cards, cards),
    inventory = coalesce(p_inventory, inventory),
    selected_team = coalesce(p_selected_team, selected_team),
    dragon_eggs = coalesce(p_dragon_eggs, dragon_eggs),
    account_level = coalesce(p_account_level, account_level),
    account_experience = coalesce(p_account_experience, account_experience),
    initialized = coalesce(p_initialized, initialized),
    marketplace_listings = coalesce(p_marketplace_listings, marketplace_listings),
    social_quests = coalesce(p_social_quests, social_quests),
    adventure_player_stats = coalesce(p_adventure_player_stats, adventure_player_stats),
    adventure_current_monster = coalesce(p_adventure_current_monster, adventure_current_monster),
    battle_state = coalesce(p_battle_state, battle_state),
    barracks_upgrades = coalesce(p_barracks_upgrades, barracks_upgrades),
    dragon_lair_upgrades = coalesce(p_dragon_lair_upgrades, dragon_lair_upgrades),
    active_workers = coalesce(p_active_workers, active_workers),
    building_levels = coalesce(p_building_levels, building_levels),
    active_building_upgrades = coalesce(p_active_building_upgrades, active_building_upgrades),
    wood = coalesce(p_wood, wood),
    stone = coalesce(p_stone, stone),
    iron = coalesce(p_iron, iron),
    gold = coalesce(p_gold, gold),
    max_wood = coalesce(p_max_wood, max_wood),
    max_stone = coalesce(p_max_stone, max_stone),
    max_iron = coalesce(p_max_iron, max_iron),
    wood_last_collection_time = coalesce(p_wood_last_collection_time, wood_last_collection_time),
    stone_last_collection_time = coalesce(p_stone_last_collection_time, stone_last_collection_time),
    wood_production_data = coalesce(p_wood_production_data, wood_production_data),
    stone_production_data = coalesce(p_stone_production_data, stone_production_data),
    updated_at = now()
  where wallet_address = p_wallet_address;
  if not found then
    return false;
  end if;
  return true;
end;
$$;

-- Allow web clients to call it
grant execute on function public.update_game_data_by_wallet_v2(
  text, integer, jsonb, jsonb, jsonb, jsonb, integer, integer, boolean, jsonb, jsonb, jsonb, jsonb, jsonb, jsonb, jsonb, jsonb, jsonb, jsonb,
  integer, integer, integer, integer, integer, integer, integer, bigint, bigint, jsonb, jsonb
) to anon, authenticated;