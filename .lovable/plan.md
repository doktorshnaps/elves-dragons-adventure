

# Fix: clan_members table public data exposure

## Problem

The `clan_members` table has an RLS policy `Anyone can view clan members` with `USING (true)`, making all member data (wallet addresses, roles, contribution amounts, join dates) readable by anyone. This data could be used to identify high-value targets or analyze clan economics.

## Analysis

**Good news:** The frontend code never queries `clan_members` directly. All 12 clan-related functions (`get_my_clan`, `get_clan_leaderboard`, `search_clans`, etc.) are `SECURITY DEFINER` RPCs, which bypass RLS entirely. This means we can safely restrict direct table access without breaking anything.

**Table columns exposed:**
- `id`, `clan_id`, `wallet_address`, `role`, `joined_at`, `contributed_ell`

**Mutation policies are already secure:**
- INSERT: `WITH CHECK (false)` -- blocked
- UPDATE: `USING (false)` -- blocked  
- DELETE: `USING (false)` -- blocked

Only the SELECT policy needs fixing.

## Solution

Replace the permissive SELECT policy with a restrictive one that blocks direct table access. All existing functionality continues to work through SECURITY DEFINER RPCs.

## Technical Details

### Database migration (single SQL statement):

```sql
-- Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Anyone can view clan members" ON public.clan_members;

-- Replace with a restrictive policy (all access goes through SECURITY DEFINER RPCs)
CREATE POLICY "No direct select on clan_members"
  ON public.clan_members FOR SELECT
  USING (false);
```

### Frontend changes: None

No code changes are needed because the app already uses RPCs exclusively:
- `get_my_clan` -- returns members of user's own clan
- `get_clan_leaderboard` -- returns aggregated clan stats
- `search_clans` -- returns clan summaries with member counts
- All management operations (kick, role change, etc.) -- SECURITY DEFINER RPCs

### After migration: Update security findings

Delete the resolved finding from the security scanner.

## Impact

- Zero functional changes -- all clan features continue working identically
- Members list, leaderboard, search, join/leave, management -- all unaffected
- Only direct table queries from malicious clients are blocked

