

# PvP Seasons System

## What Already Exists

The database already has strong foundations:
- `pvp_seasons` table with `season_number`, `name`, `starts_at`, `ends_at`, `is_active`, `rewards_config` (JSONB with tier-based ELL/card rewards)
- `pvp_ratings` table linked to seasons via `season_id`
- `pvp_matches` table linked to seasons via `season_id`
- Active Season 1 running ("Сезон 1: Начало") until April 23, 2026
- `get_active_pvp_season()` function used throughout ELO calculations

What's **missing**: admin management UI, season end-of-season leaderboard with rewards, and reward distribution logic.

---

## Plan Overview

### Part 1: Database -- Admin RPC Functions

Create a migration with 3 new RPC functions:

**`admin_create_pvp_season`** -- Create a new season with parameters:
- `p_admin_wallet_address` (verified via `is_admin_or_super_wallet`)
- `p_name` (season name, e.g. "Season 2: Dragons")
- `p_duration_days` (how many days the season lasts)
- `p_rewards_config` (JSONB with rewards per Elo tier)
- Auto-increments `season_number`, sets `starts_at` = now, `ends_at` = now + duration
- Deactivates any currently active season first

**`admin_update_pvp_season`** -- Edit an existing season:
- Update name, end date, rewards_config
- Only allows edits while season is still active

**`admin_end_pvp_season`** -- End season early and prepare results:
- Sets `is_active = false`, `ends_at = now()`
- Returns the season ID for reward distribution

**`get_pvp_season_leaderboard`** -- Get season results with rewards:
- Accepts `p_season_id` (UUID)
- Returns top players from `pvp_ratings` for that season, joined with the rewards_config to show what each tier earns
- Includes: rank, wallet, elo, tier, wins, losses, win_rate, reward_ell, reward_bonus

**`admin_distribute_season_rewards`** -- Actually give out rewards:
- Takes `p_admin_wallet_address` and `p_season_id`
- Iterates through all players in that season's `pvp_ratings`
- Based on each player's final `tier`, adds ELL via `add_ell_balance`
- Marks the season as "rewards_distributed" (new boolean column) to prevent double distribution

### Part 2: Schema Changes

Add one column to `pvp_seasons`:
- `rewards_distributed boolean DEFAULT false` -- prevents double reward payout

### Part 3: Admin Panel Component

Create `src/components/admin/PvPSeasonAdmin.tsx`:

- **Current Season Card**: Shows active season name, number, start/end dates, time remaining countdown
- **Rewards Configuration**: Editable table/form showing each Elo tier (Bronze through Legend) with:
  - Tier name and Elo range
  - ELL reward amount (editable input)
  - Bonus card rarity (select dropdown)
  - Special title flag (checkbox for Legend tier)
- **Create New Season**: Form with name, duration (days/hours), rewards config
- **End Season Button**: Ends current season early with confirmation dialog
- **Season History**: List of past seasons with their results
- **Distribute Rewards Button**: For ended seasons, triggers reward distribution with progress indicator

### Part 4: Admin Panel Integration

Update `src/pages/AdminSettings.tsx`:
- Add new "PvP Сезоны" tab trigger
- Add `TabsContent` with `PvPSeasonAdmin` component
- Add import for the new component

### Part 5: PvP Hub -- Season Info Display

Update `src/components/game/pvp/PvPHub.tsx`:
- Add a **Season Banner** card at the top showing:
  - Current season name and number
  - Time remaining (countdown)
  - Current tier rewards preview (what player earns at their current Elo tier)
- Fetch active season data on mount via Supabase query

### Part 6: Season Leaderboard in PvP Hub

Update `src/components/game/pvp/PvPLeaderboard.tsx`:
- Add a **"Season Results"** tab alongside the existing leaderboard
- When a season has ended, show:
  - Final rankings with positions
  - Each player's tier and corresponding reward
  - Highlight "Rewards distributed" or "Awaiting rewards" status
- For the current season: show the live leaderboard with reward preview per tier

### Part 7: Hook for Season Data

Create `src/hooks/usePvPSeason.ts`:
- Fetches active season info
- Fetches season leaderboard for ended seasons
- Provides countdown timer for season end
- Caches via React Query with appropriate stale times

---

## Technical Details

### Rewards Config Structure (existing format, kept as-is)

```text
{
  "bronze":   { "icon": "...", "min_elo": 0,    "max_elo": 1199, "ell_reward": 500 },
  "silver":   { "icon": "...", "min_elo": 1200, "max_elo": 1399, "ell_reward": 1500 },
  "gold":     { "icon": "...", "min_elo": 1400, "max_elo": 1599, "ell_reward": 3000 },
  "platinum": { "icon": "...", "min_elo": 1600, "max_elo": 1799, "ell_reward": 5000, "bonus_card": true },
  "diamond":  { "icon": "...", "min_elo": 1800, "max_elo": 1999, "ell_reward": 10000, "bonus_card": "rare" },
  "master":   { "icon": "...", "min_elo": 2000, "max_elo": 2199, "ell_reward": 20000, "bonus_card": "epic" },
  "legend":   { "icon": "...", "min_elo": 2200, "max_elo": 99999, "ell_reward": 50000, "bonus_card": "legendary", "title": true }
}
```

### Files to Create
- `src/components/admin/PvPSeasonAdmin.tsx` -- Admin season management component
- `src/hooks/usePvPSeason.ts` -- Season data hook
- Migration SQL file -- RPC functions + schema change

### Files to Edit
- `src/pages/AdminSettings.tsx` -- Add PvP Seasons tab
- `src/components/game/pvp/PvPHub.tsx` -- Add season banner
- `src/components/game/pvp/PvPLeaderboard.tsx` -- Add season results view
- `src/integrations/supabase/types.ts` -- Update types for new column and RPCs

### Key Design Decisions
- Rewards are **not auto-distributed** at season end -- admin clicks a button to review and confirm, preventing accidents
- Each season stores its own `rewards_config`, so historical seasons preserve what rewards were offered
- The leaderboard for ended seasons queries `pvp_ratings` by `season_id`, showing the frozen final standings
- Season banner in PvP Hub uses the existing `pvp_seasons` table data, no new tables needed
