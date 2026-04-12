

# Fix: Seekers Leaderboard Empty + Soul Altar Donation Loss

## Problem 1: Seekers Leaderboard Shows Empty

**Root cause**: The `treasure_hunt_findings` table has an RLS policy that only allows users to see **their own** records:
```
treasure_hunt_findings_select_own: wallet_address = get_current_user_wallet()
```
The `Seekers.tsx` page queries ALL findings for the event to build a leaderboard, but RLS filters out everyone else's records. Result: leaderboard appears empty unless you personally found an item.

**Fix**: Create a SECURITY DEFINER RPC function `get_treasure_hunt_leaderboard(p_event_id)` that returns all findings with masked wallet addresses (same pattern as `get_soul_donations_leaderboard`). Update `Seekers.tsx` to use this RPC instead of direct table query.

## Problem 2: Soul Altar - Crystals Disappear But Donation Not Recorded

**Root cause**: In `SoulAltarTab.tsx`, the donation flow is:
1. Remove crystal instances from `item_instances` (irreversible)
2. Insert into `soul_donations`

If step 2 fails (network error, RLS issue), the crystals are already gone. Additionally, the SELECT policies on `soul_donations` target `public` role instead of `authenticated`, which may cause `get_current_user_wallet()` to fail silently.

**Fix**:
- Reverse the order: insert donation FIRST, then remove crystals
- Better: create an Edge Function or RPC that does both atomically
- Fix SELECT policies to target `authenticated` role

## Changes

### Migration (new SQL)
1. Create `get_treasure_hunt_leaderboard(p_event_id UUID)` RPC - SECURITY DEFINER, returns findings with masked wallets, ordered by `found_quantity DESC`
2. Create `donate_soul_crystals(p_wallet TEXT, p_amount INT)` RPC - SECURITY DEFINER, atomically inserts donation AND removes crystal item_instances in one transaction
3. Fix `soul_donations` SELECT policies: change role from `public` to `authenticated`

### Frontend changes
1. **`src/pages/Seekers.tsx`** (~line 148-161): Replace direct `supabase.from('treasure_hunt_findings').select(...)` with `supabase.rpc('get_treasure_hunt_leaderboard', { p_event_id: eventId })`
2. **`src/components/soul-altar/SoulAltarTab.tsx`** (~line 105-135): Replace manual crystal deletion + donation insert with single `supabase.rpc('donate_soul_crystals', { p_wallet, p_amount })` call. Remove `removeItemInstancesByIds` from the donation flow. After success, invalidate `itemInstances` query cache to reflect removed crystals.

