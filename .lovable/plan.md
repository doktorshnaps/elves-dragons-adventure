
# Security Fixes: Deep Analysis and Resolution Plan

## Summary of Findings

The security scan found **2 critical errors** and **several warnings**. The root cause is that the app uses **wallet-based authentication (NEAR)**, not Supabase Auth, so `auth.uid()` is always `null` for client queries. This makes standard RLS patterns using `get_current_user_wallet()` ineffective, leading to overly permissive `USING (true)` workarounds.

---

## Error 1: profiles table publicly exposes all data

**Problem:** The `profiles_select_all` policy uses `USING (true)`, making all fields (`id`, `user_id`, `wallet_address`, `display_name`, timestamps) readable by anyone. Attackers could harvest wallet-to-identity mappings.

**Current app usage:**
- `useDisplayName.ts` directly queries `profiles` table for the current user's own name
- `useDisplayNames.ts` uses the `get_display_names` RPC (SECURITY DEFINER) for batch lookups -- this already bypasses RLS

**Fix:**
1. Create a database view `profiles_public` that only exposes `wallet_address` and `display_name` (hides `id`, `user_id`, timestamps)
2. Set `security_invoker = on` on the view
3. Restrict the base `profiles` table SELECT to `USING (false)` -- all access via RPCs or view
4. Update `useDisplayName.ts` to query from `profiles_public` instead of `profiles`

---

## Error 2: pvp_queue has conflicting SELECT policies

**Problem:** Two SELECT policies exist:
- `Users can view own queue entry` with `wallet_address = get_current_user_wallet()` (correct intent, but doesn't work because `auth.uid()` is null)
- `Users can view their own queue entries` with `USING (true)` (overrides the first, exposes all team compositions)

**Current app usage:**
- Only `usePvP.ts` reads from `pvp_queue` directly (one query to check own queue entry)
- All other operations (join, leave) use RPCs

**Fix:**
1. Create an RPC `get_my_queue_entry(p_wallet text)` that returns only the caller's queue entry
2. Drop the overly permissive `Users can view their own queue entries` policy
3. Keep the `Users can view own queue entry` policy (harmless since it returns nothing anyway)
4. Update `usePvP.ts` to use the new RPC instead of direct table query

---

## Warning: pvp_bot_teams INSERT/UPDATE/DELETE too permissive

**Problem:** All mutation policies use `USING (true)` / `WITH CHECK (true)`, allowing anyone to create/modify/delete bot teams.

**Current usage:** Bot teams are managed exclusively via the `manage_bot_team` RPC (SECURITY DEFINER), so client code never writes directly.

**Fix:** Restrict INSERT/UPDATE/DELETE to service_role only:
```
USING (current_setting('role', true) = 'service_role')
```

---

## Warning: Function search_path mutable

**Problem:** Some database functions don't have `search_path` set, making them vulnerable to search_path manipulation.

**Fix:** Add `SET search_path = public` to the `get_current_user_wallet` function and other affected functions.

---

## Warnings deliberately kept as-is (with justification)

- **pvp_ratings public SELECT** -- intentional for leaderboard display; only contains wallet, ELO, win/loss stats (no sensitive data)
- **pvp_matches completed SELECT** -- intentional for match history; `battle_state` for completed matches is not sensitive (game is over)
- **wallet_connections no SELECT** -- info-level; users don't need to see connection history in the current app

---

## Technical Implementation

### Step 1: Database migration (SQL)

```sql
-- 1. Create public view for profiles (hide sensitive fields)
CREATE VIEW public.profiles_public
WITH (security_invoker = on) AS
  SELECT wallet_address, display_name
  FROM public.profiles;

-- 2. Restrict base profiles table SELECT
DROP POLICY IF EXISTS "profiles_select_all" ON public.profiles;
CREATE POLICY "profiles_no_direct_select"
  ON public.profiles FOR SELECT
  USING (false);

-- 3. Fix pvp_queue: drop the permissive policy
DROP POLICY IF EXISTS "Users can view their own queue entries" ON public.pvp_queue;

-- 4. Create RPC for checking own queue entry
CREATE OR REPLACE FUNCTION public.get_my_queue_entry(p_wallet text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT to_jsonb(q.*) INTO v_result
  FROM pvp_queue q
  WHERE q.wallet_address = p_wallet
    AND q.status = 'searching'
    AND q.expires_at > now()
  LIMIT 1;
  
  RETURN v_result;
END;
$$;

-- 5. Fix pvp_bot_teams mutation policies
DROP POLICY IF EXISTS "Users can insert their own bot teams" ON public.pvp_bot_teams;
DROP POLICY IF EXISTS "Users can update their own bot teams" ON public.pvp_bot_teams;
DROP POLICY IF EXISTS "Users can delete their own bot teams" ON public.pvp_bot_teams;

CREATE POLICY "Service role can insert bot teams"
  ON public.pvp_bot_teams FOR INSERT
  WITH CHECK (current_setting('role', true) = 'service_role');

CREATE POLICY "Service role can update bot teams"
  ON public.pvp_bot_teams FOR UPDATE
  USING (current_setting('role', true) = 'service_role');

CREATE POLICY "Service role can delete bot teams"
  ON public.pvp_bot_teams FOR DELETE
  USING (current_setting('role', true) = 'service_role');

-- 6. Fix search_path on get_current_user_wallet
CREATE OR REPLACE FUNCTION public.get_current_user_wallet()
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wallet_address text;
BEGIN
  SELECT wallet_address INTO v_wallet_address
  FROM public.game_data
  WHERE user_id = auth.uid()
  LIMIT 1;
  RETURN v_wallet_address;
END;
$$;
```

### Step 2: Update frontend code

**File: `src/hooks/useDisplayName.ts`**
- Change `.from('profiles')` to `.from('profiles_public')` for the display name query

**File: `src/hooks/usePvP.ts`**
- Replace the direct `pvp_queue` table query in `checkExistingQueue` with a call to the new `get_my_queue_entry` RPC

**File: `src/integrations/supabase/types.ts`**
- Add the `profiles_public` view and `get_my_queue_entry` RPC to the types

### Step 3: Mark resolved security findings

After implementation, delete/update the resolved security findings in the scanner.

---

## Impact Assessment

- **No visual changes** -- all functionality stays the same
- **profiles**: Display names still work everywhere (via RPC and view)
- **pvp_queue**: Queue join/leave/check still works (via RPC)
- **pvp_bot_teams**: Bot matching still works (all via SECURITY DEFINER RPCs)
- **Risk**: Minimal -- all current client queries are already filtered by wallet or use RPCs
