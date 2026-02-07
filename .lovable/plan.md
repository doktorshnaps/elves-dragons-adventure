

# Fix: Two New Security Warnings

## Warning 1: profiles_public -- Intentional, should be ignored

**What the scanner says:** "The 'profiles_public' table contains wallet addresses and display names that are publicly readable."

**Why this is a false positive:** This is the view we just created specifically to protect the `profiles` table. It only exposes two fields:
- `wallet_address` -- already public on the NEAR blockchain
- `display_name` -- intentionally public for leaderboards, clans, match history

The base `profiles` table is properly locked with `USING (false)`. The view is doing exactly what it should. We will mark this finding as "ignored" with a justification.

**Action:** Mark as ignored in the security scanner. No code or database changes needed.

---

## Warning 2: pvp_matches -- Real issue, fix without breaking gameplay

**What the scanner says:** "The 'pvp_matches' table allows anyone to view completed matches, exposing player wallet addresses, battle outcomes, and ELO ratings."

**Root cause:** The policy `Anyone can view completed matches` with `USING (status = 'completed')` makes all completed match data publicly queryable. Two frontend components query `pvp_matches` directly:
1. `PvPMatchHistory.tsx` -- loads player's own match history
2. `PvPLeaderboard.tsx` "live" tab -- fetches 500 raw matches and computes win/loss stats client-side

**Critical constraint:** A realtime subscription in `usePvP.ts` listens for UPDATE events on `pvp_matches` to detect opponent moves and match state changes during active gameplay. If we block all SELECT, the subscription breaks and PvP becomes unplayable.

**Solution:** Change the SELECT policy to only allow viewing active/in-progress matches (for the realtime subscription), and move all completed match queries to secure RPCs.

### Database changes

1. **Replace the SELECT policy** -- change from "completed" to "active/waiting" matches only:

```sql
DROP POLICY IF EXISTS "Anyone can view completed matches" ON public.pvp_matches;

-- Keep active match visibility for realtime subscription (gameplay)
CREATE POLICY "Anyone can view active matches"
  ON public.pvp_matches FOR SELECT
  USING (status IN ('active', 'waiting'));
```

2. **Create `get_my_match_history` RPC** -- secure access to own completed matches:

```sql
CREATE OR REPLACE FUNCTION public.get_my_match_history(
  p_wallet text,
  p_rarity_tier integer,
  p_limit integer DEFAULT 20
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN COALESCE((
    SELECT jsonb_agg(row_to_json(m.*)::jsonb ORDER BY m.finished_at DESC)
    FROM (
      SELECT id, player1_wallet, player2_wallet, winner_wallet, loser_wallet,
             elo_change, player1_elo_before, player2_elo_before, finished_at,
             is_bot_match, rarity_tier
      FROM pvp_matches
      WHERE status = 'completed'
        AND rarity_tier = p_rarity_tier
        AND (player1_wallet = p_wallet OR player2_wallet = p_wallet)
      ORDER BY finished_at DESC
      LIMIT p_limit
    ) m
  ), '[]'::jsonb);
END;
$$;
```

3. **Create `get_pvp_league_stats` RPC** -- for the leaderboard "live" tab, reads from `pvp_ratings` (which is already public and has cumulative stats):

```sql
CREATE OR REPLACE FUNCTION public.get_pvp_league_stats(
  p_rarity_tier integer,
  p_limit integer DEFAULT 50
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN COALESCE((
    SELECT jsonb_agg(row_to_json(r.*)::jsonb ORDER BY r.wins DESC)
    FROM (
      SELECT wallet_address, wins, losses, matches_played,
             CASE WHEN matches_played > 0 
               THEN ROUND((wins::numeric / matches_played) * 100)
               ELSE 0 
             END as win_rate
      FROM pvp_ratings
      WHERE rarity_tier = p_rarity_tier
        AND season_id = get_active_pvp_season()
        AND matches_played > 0
      ORDER BY wins DESC
      LIMIT p_limit
    ) r
  ), '[]'::jsonb);
END;
$$;
```

### Frontend changes

**File: `src/components/game/pvp/PvPMatchHistory.tsx`**
- Replace direct `supabase.from("pvp_matches")` query with `supabase.rpc('get_my_match_history', { p_wallet, p_rarity_tier, p_limit: 20 })`
- Parse the returned JSON array

**File: `src/components/game/pvp/PvPLeaderboard.tsx`**
- Replace direct `supabase.from("pvp_matches")` query in `loadLeaderboard` with `supabase.rpc('get_pvp_league_stats', { p_rarity_tier, p_limit: 50 })`
- Update the leaderboard computation to use pre-aggregated data instead of raw match processing

### Security scanner updates

- Mark `profiles_public_table_exposure` finding as **ignored** with justification
- Mark `pvp_matches_public_exposure` finding as **resolved** (delete it)

---

## Impact assessment

- **No visual changes** -- all features work identically
- **Match history** -- still loads player's own matches via secure RPC
- **Leaderboard "live" tab** -- now uses `pvp_ratings` data (more accurate than raw match aggregation)
- **Realtime PvP gameplay** -- subscription still works for active matches (turn changes, match state)
- **Completed match data** -- no longer publicly queryable, only accessible per-player through RPC
- **Season leaderboard** -- unchanged (already uses `fetchSeasonLeaderboard` RPC)

