

## Two Bugs Found

### Bug 1: `resurrect_card_in_medical_bay` — Function Overloading

**Error**: "Could not choose the best candidate function"

**Cause**: Two versions of the function exist in the database:
- Original (migration `20251202`): `p_card_instance_id UUID`
- Updated (migration `20260412`): `p_card_instance_id TEXT`

PostgREST cannot resolve which to call when both have the same name. Per the project's memory on `database-rpc-standardization`, overloading is prohibited.

**Fix**: Create a new migration that:
1. Drops the old UUID-signature version: `DROP FUNCTION IF EXISTS public.resurrect_card_in_medical_bay(UUID, TEXT);`
2. Keeps only the TEXT version (which internally casts to UUID)

### Bug 2: `open-elleonor-box` — Invalid Auth Method (`getClaims`)

**Error**: "Edge Function returned a non-2xx status code"

**Cause**: The edge function uses `userClient.auth.getClaims(token)` which does not exist in the Supabase JS v2 client. This causes a runtime error, returning a 500 to the frontend.

**Fix**: Replace `getClaims` with `getUser()` in `open-elleonor-box/index.ts`:

```typescript
const { data: { user }, error: authError } = await userClient.auth.getUser();
if (authError || !user) {
  return json({ success: false, error: "Invalid token" }, 401);
}
const userId = user.id;
```

Same fix needed in `sell-item/index.ts` (same pattern, same bug). Then redeploy both edge functions.

### Files to Change
1. **New SQL migration** — Drop the overloaded `resurrect_card_in_medical_bay(UUID, TEXT)` signature
2. **`supabase/functions/open-elleonor-box/index.ts`** — Replace `getClaims` with `getUser()`
3. **`supabase/functions/sell-item/index.ts`** — Replace `getClaims` with `getUser()`
4. Deploy both edge functions

