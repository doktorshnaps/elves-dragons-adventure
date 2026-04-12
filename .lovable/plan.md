

# Fix: Forge Bay Function Overload Conflict

## Problem
The error `Could not choose the best candidate function between: public.add_card_to_forge_bay(p_card_instance => text, ...) and public.add_card_to_forge_bay(p_card_instance => uuid, ...)` occurs because the recent migration created a second version of the function with `uuid` parameter type, but didn't drop the old `text` version. PostgREST cannot resolve which function to call.

## Solution
Drop the `uuid` version (which lacks slot limit enforcement) and keep the `text` version (which has the correct slot limit validation).

## Technical Details

**Database migration** -- single SQL statement:
```sql
DROP FUNCTION IF EXISTS public.add_card_to_forge_bay(p_card_instance_id uuid, p_wallet_address text);
```

The remaining `text` version already:
- Casts `p_card_instance_id::UUID` internally where needed
- Enforces forge slot limits (`forge_level + 1`)
- Checks for duplicate entries in both forge and medical bays

No frontend changes needed.

