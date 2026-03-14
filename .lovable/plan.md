

## Security Fixes Plan — 5 Error-Level Findings

### Finding 1: `sync-player-cards` and `migrate-cards-to-instances` — No Authentication

**Risk:** Anyone can trigger card sync/migration for any wallet via `curl`.

**Best fix:** Add admin wallet verification to both Edge Functions, same pattern used in `admin-recalculate-card-stats`. Both functions are admin/migration utilities not called from client code.

**Changes:**
- **`supabase/functions/sync-player-cards/index.ts`** — require `wallet_address` (caller) in body, check `is_admin_or_super_wallet` via RPC before proceeding
- **`supabase/functions/migrate-cards-to-instances/index.ts`** — same admin check
- Both already use service role client, so the RPC call works

---

### Finding 2: Privilege Escalation via `game_data` INSERT

**Risk:** Authenticated user inserts a row with `wallet_address = 'mr_bruts.tg'`, then `get_current_user_wallet()` returns admin wallet, granting full admin access.

**Current policy:** `INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid())` — no constraint on `wallet_address`.

**Best fix:** Block direct INSERT entirely. Game data records are created by service role (Edge Functions). No legitimate client-side INSERT exists.

**Changes:**
- **SQL migration:** Replace `game_data_insert_policy` with `WITH CHECK (false)` to block all direct inserts. Service role bypasses RLS.

---

### Finding 3: Referrals INSERT — `current_setting('role') = 'authenticated'` Bypasses Wallet Check

**Risk:** Any authenticated user can fabricate referral records for arbitrary wallets.

**Current policy** (from migration `20260311`): First OR clause `current_setting('role', true) = 'authenticated'` is always true for authenticated users, making the wallet check irrelevant.

**Best fix:** Remove the role-based clause. Referrals are created via SECURITY DEFINER RPC `add_referral`, which runs as `security_definer` role and bypasses RLS anyway. Lock direct INSERT to `false`.

**Changes:**
- **SQL migration:** `DROP POLICY ... referrals_insert_policy; CREATE POLICY ... WITH CHECK (false);`

---

### Finding 4: `mgt_claims` SELECT via Spoofable Header

**Risk:** Anyone can read any wallet's MGT claim history by setting `x-wallet-address` header.

**Current policy:** `wallet_address = current_setting('request.headers')::json->>'x-wallet-address' OR wallet_address = auth.jwt()->>'wallet_address'`

**Best fix:** Remove header-based condition. Use `get_current_user_wallet()` for user access (consistent with rest of project). Admin access already has a separate policy.

**Changes:**
- **SQL migration:** Drop and recreate SELECT policy using `wallet_address = get_current_user_wallet()`

---

### Finding 5: `soul_donations` INSERT — Anonymous Access

**Risk:** Unauthenticated users can insert donation records with arbitrary amounts for any wallet.

**Current policy:** `wallet_address IS NOT NULL AND length(trim(wallet_address)) > 0` — no auth check.

**Client code** (`SoulAltarTab.tsx` line 131): Inserts directly via `.from('soul_donations').insert(...)` using the connected wallet's `accountId`.

**Best fix:** Require authentication and restrict to own wallet using `get_current_user_wallet()`.

**Changes:**
- **SQL migration:** Drop old INSERT policy, create new one: `TO authenticated WITH CHECK (wallet_address = get_current_user_wallet())`

---

### Summary of Changes

| # | Fix | Files |
|---|-----|-------|
| 1 | Admin check on sync/migrate Edge Functions | 2 Edge Functions |
| 2 | Block direct game_data INSERT | 1 SQL migration |
| 3 | Block direct referrals INSERT | 1 SQL migration |
| 4 | Fix mgt_claims SELECT to use wallet function | 1 SQL migration |
| 5 | Restrict soul_donations INSERT to authenticated + own wallet | 1 SQL migration |

Fixes 2-5 are combined into a single SQL migration. Fix 1 requires editing two Edge Function files.

