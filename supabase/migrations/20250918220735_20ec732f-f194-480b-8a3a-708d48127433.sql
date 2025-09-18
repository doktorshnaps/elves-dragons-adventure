-- Resolve PostgREST function overloading error for update_game_data_by_wallet
-- Drop the legacy overload without p_active_workers to remove ambiguity
DROP FUNCTION IF EXISTS public.update_game_data_by_wallet(
  text,  -- p_wallet_address
  integer,  -- p_balance
  jsonb,  -- p_cards
  jsonb,  -- p_inventory
  jsonb,  -- p_selected_team
  jsonb,  -- p_dragon_eggs
  integer,  -- p_account_level
  integer,  -- p_account_experience
  boolean,  -- p_initialized
  jsonb,  -- p_marketplace_listings
  jsonb,  -- p_social_quests
  jsonb,  -- p_adventure_player_stats
  jsonb,  -- p_adventure_current_monster
  jsonb,  -- p_battle_state
  jsonb,  -- p_barracks_upgrades
  jsonb   -- p_dragon_lair_upgrades
);

-- Ensure the unified function with p_active_workers exists (no changes if already present)
-- Note: We intentionally do NOT recreate the function here to avoid overwriting existing logic.
