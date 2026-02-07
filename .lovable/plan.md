
# Add League Rewards to PvP Seasons

## Context

Currently, season rewards are only configured by **Elo tiers** (Bronze through Legend, based on player rating). The user wants to also support **league rewards** -- based on which of the 8 rarity leagues (1-8) a player participates in. Admins should be able to configure both independently.

## Current State

- `pvp_seasons.rewards_config` (JSONB) stores Elo tier rewards only:
  ```text
  { "bronze": { "min_elo": 0, "max_elo": 1199, "ell_reward": 500 }, ... }
  ```
- `pvp_ratings` has no league/rarity info -- just per-season Elo data
- `pvp_matches` has `rarity_tier` (integer 1-8) for every match
- Admin UI shows only tier rewards editing

## Proposed Solution

Add a second rewards dimension: **league rewards**. A player receives BOTH:
1. **Tier reward** -- based on their final Elo (existing logic)
2. **League reward** -- based on the highest rarity league they played in during the season (derived from `pvp_matches.rarity_tier`)

---

## Changes Overview

### 1. Database Migration

**New column** on `pvp_seasons`:
- `league_rewards_config jsonb DEFAULT '{}'` -- stores per-league rewards

Structure:
```text
{
  "1": { "name": "Обычные",         "ell_reward": 0 },
  "2": { "name": "Необычные",       "ell_reward": 100 },
  "3": { "name": "Редкие",          "ell_reward": 300 },
  "4": { "name": "Эпические",       "ell_reward": 500 },
  "5": { "name": "Легендарные",     "ell_reward": 1000 },
  "6": { "name": "Мифические",      "ell_reward": 2000 },
  "7": { "name": "Божественные",    "ell_reward": 5000 },
  "8": { "name": "Трансцендентные", "ell_reward": 10000 }
}
```

**Updated RPCs:**

- `admin_create_pvp_season` -- accept `p_league_rewards_config jsonb` parameter
- `admin_update_pvp_season` -- accept `p_league_rewards_config jsonb` parameter
- `admin_distribute_season_rewards` -- after distributing tier rewards, also look up each player's highest `rarity_tier` from `pvp_matches` in the season and add the corresponding league reward
- `get_pvp_season_leaderboard` -- no change needed (league info can be displayed client-side)

### 2. Admin Panel (`PvPSeasonAdmin.tsx`)

Split the rewards display into two sections:

**Section A: "Награды по тирам" (existing)**
- Same as now -- Elo tier rewards (Bronze through Legend)
- Editable ELL amounts per tier

**Section B: "Награды по лигам" (new)**
- 8 rows, one per rarity league
- Each row shows: league number, league name (e.g., "Обычные ★1"), editable ELL reward
- Same editing flow as tier rewards (edit/save buttons)

Both sections appear in:
- Current Season card (view + edit mode)
- Create New Season form (configuration)

### 3. Hook (`usePvPSeason.ts`)

- Update `PvPSeason` interface to include `league_rewards_config`
- Add `getPlayerLeagueReward(league: number)` function to look up the league reward for a given league number from the active season config

### 4. PvP Hub (`PvPHub.tsx`)

Update the season banner to show both rewards:
- Tier reward: existing display (e.g., "5000 ELL" based on Elo)
- League reward: show the reward for the currently selected rarity tier (e.g., "Лига 4: +500 ELL")

### 5. Leaderboard (`PvPLeaderboard.tsx`)

In the season tab, show the combined reward (tier + league) for each player. Since we don't have per-player league data in the leaderboard RPC response, the tier reward column already works; the league reward can be shown as a general info banner at the top of the season tab.

---

## Technical Details

### Database Migration SQL

1. Add column:
   ```text
   ALTER TABLE public.pvp_seasons
   ADD COLUMN IF NOT EXISTS league_rewards_config jsonb DEFAULT '{}'::jsonb;
   ```

2. Update `admin_create_pvp_season`:
   - Add parameter `p_league_rewards_config jsonb DEFAULT '{}'::jsonb`
   - Store it in the INSERT

3. Update `admin_update_pvp_season`:
   - Add parameter `p_league_rewards_config jsonb DEFAULT NULL`
   - Include in the UPDATE SET clause with COALESCE

4. Update `admin_distribute_season_rewards`:
   - After finding the tier reward for a player, also query:
     ```text
     SELECT MAX(rarity_tier) FROM pvp_matches
     WHERE season_id = p_season_id
       AND (player1_wallet = v_player.wallet_address OR player2_wallet = v_player.wallet_address)
       AND status = 'completed'
     ```
   - Look up that max league in `league_rewards_config` and add to the player's reward
   - Track `total_league_ell_distributed` in the return JSON

### Files to Create/Edit

| File | Action |
|------|--------|
| Migration SQL | Create -- new column + updated RPCs |
| `src/hooks/usePvPSeason.ts` | Edit -- add `league_rewards_config` to types, add `getPlayerLeagueReward` |
| `src/components/admin/PvPSeasonAdmin.tsx` | Edit -- add league rewards section to current season card and create form |
| `src/components/game/pvp/PvPHub.tsx` | Edit -- show league reward in season banner |
| `src/components/game/pvp/PvPLeaderboard.tsx` | Edit -- show league reward info in season tab |
| `src/integrations/supabase/types.ts` | Edit -- update types for new column and RPC params |

### Default League Rewards Config

Used when creating a new season if admin doesn't customize:
```text
League 1 (Обычные):         0 ELL
League 2 (Необычные):       100 ELL
League 3 (Редкие):          300 ELL
League 4 (Эпические):       500 ELL
League 5 (Легендарные):     1000 ELL
League 6 (Мифические):      2000 ELL
League 7 (Божественные):    5000 ELL
League 8 (Трансцендентные): 10000 ELL
```

### Reward Distribution Logic (Updated)

For each player in the ended season:
1. Find tier reward from `rewards_config` (by Elo range) -- existing
2. Find highest league played from `pvp_matches` -- new
3. Find league reward from `league_rewards_config` (by highest league) -- new
4. Total reward = tier_reward + league_reward
5. Call `add_ell_balance` with total
