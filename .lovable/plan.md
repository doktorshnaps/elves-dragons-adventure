

# Dynamic Elo (K-Factor by Rating Difference)

## Problem

Currently the PvP system uses a flat +/-25 Elo change for every match, regardless of the skill gap between players. This creates unfair ranking:

- A Bronze player (1000 Elo) beating a Legend (2200 Elo) gains the same 25 points as beating another Bronze
- A Legend losing to a Bronze loses only 25 points -- no real penalty for the upset

Standard competitive games use the **Expected Win Probability** formula to scale rewards based on the upset factor.

## How Dynamic Elo Works

The standard Elo formula:

```text
Expected Win = 1 / (1 + 10^((OpponentElo - YourElo) / 400))

Winner gains: K * (1 - ExpectedWin)
Loser loses:  K * ExpectedWin
```

Real-world examples with K=32:

```text
Same skill (1500 vs 1500):
  Expected = 0.50 -> Winner: +16, Loser: -16

Upset (1200 beats 1800):
  Expected = 0.09 -> Winner: +29, Loser: -29

Stomp (1800 beats 1200):
  Expected = 0.91 -> Winner: +3,  Loser: -3
```

Additionally, K-factor itself can scale by tier to stabilize high-rank progression:

```text
Bronze-Gold (0-1599):    K = 32  (fast climbing)
Platinum-Diamond (1600-1999): K = 24  (moderate)
Master-Legend (2000+):   K = 16  (stable at top)
```

## Solution: Centralize in Database Function

Instead of calculating Elo in Edge Functions, the DB function `update_pvp_elo` will read both players' ratings, compute the dynamic change, and return the result.

```text
BEFORE:
  Edge Function -> hardcode eloChange=25 -> call update_pvp_elo(winner, loser, 25)

AFTER:
  Edge Function -> call update_pvp_elo(winner, loser) -> get back calculated change
```

## Changes

### 1. Database Migration: Rewrite `update_pvp_elo`

Replace the current function with a new version that:

- Removes the `p_elo_change` parameter (no longer needed)
- Reads current Elo of both players from `pvp_ratings`
- Selects K-factor based on the player's tier bracket (32 / 24 / 16)
- Calculates expected win probability using the standard formula
- Applies asymmetric changes (winner and loser can gain/lose different amounts due to different K-factors)
- Returns the calculated `elo_change` (average of winner gain and loser loss for match record)
- Keeps bot/SKIP_BOT exclusion logic intact
- For bot matches, uses a fixed K=32 with 1000 as assumed bot Elo

### 2. Edge Function: `pvp-submit-move`

Update all ~8 places where `eloChange = 25` is hardcoded:

- Remove the hardcoded `const eloChange = 25;` lines
- Call the updated `update_pvp_elo` RPC (without `p_elo_change` parameter)
- Capture the returned `elo_change` value from the RPC result
- Use the dynamic value when updating the `pvp_matches` record and in the API response

Affected code paths (all inside `pvp-submit-move/index.ts`):
- Line 190: surrender (PvP)
- Line 335: bot wins (trigger_bot_turn)
- Line 392: human wins via counterattack (trigger_bot_turn)
- Line 613: attacker wins (normal PvP)
- Line 683: attacker loses via counterattack (normal PvP)
- Line 860: bot wins (inline bot turn)
- Line 883: human wins via counterattack (inline bot turn)
- Line 966: elo_change in response

### 3. Edge Function: `pvp-process-timeout`

Remove the duplicated inline Elo calculation and rating update logic (lines 42-108). Instead:

- Call `update_pvp_elo` RPC like `pvp-submit-move` does
- Use the returned `elo_change` for match record
- Remove the manual `pvp_ratings` UPDATE queries (winner and loser)
- Keep only the match status update and winner reward credit

### 4. Update TypeScript Types

Update `src/integrations/supabase/types.ts` to reflect the new function signature:
- Remove `p_elo_change` from `update_pvp_elo` Args
- Add return type for the calculated elo change

## Summary of Files to Modify

| File | Change |
|------|--------|
| New migration SQL | Rewrite `update_pvp_elo` with dynamic calculation and return value |
| `supabase/functions/pvp-submit-move/index.ts` | Remove hardcoded 25, use RPC return value (~8 locations) |
| `supabase/functions/pvp-process-timeout/index.ts` | Remove inline Elo logic, delegate to `update_pvp_elo` |
| `src/integrations/supabase/types.ts` | Update function signature |

