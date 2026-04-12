

# Fix: Duplicate key error in Forge Bay

## Problem
When placing a card in the forge, the RPC `add_card_to_forge_bay` succeeds (repair starts), but a duplicate call (likely from real-time subscription triggering a re-render or double-click edge case) hits the unique constraint `idx_forge_bay_active_card` and shows an error toast.

The function has a check on line 98 (`IF EXISTS ... WHERE card_instance_id = ... AND is_completed = false`), but there is a race condition: two concurrent calls can both pass this check before either inserts.

## Solution
Two changes in the RPC function:

1. **Add row-level locking** — `SELECT ... FOR UPDATE` on the card_instances row to serialize concurrent calls
2. **Use `ON CONFLICT DO NOTHING`** on the INSERT into `forge_bay` and check if a row was actually inserted — if not, return the existing entry ID instead of raising an error

## Technical Details

**Database migration** — recreate the function with conflict handling:

```sql
CREATE OR REPLACE FUNCTION public.add_card_to_forge_bay(...)
```

Key changes inside the function:
- Lock the card_instances row with `FOR UPDATE` to prevent concurrent modifications
- Replace the plain `INSERT INTO forge_bay ... RETURNING id` with `INSERT ... ON CONFLICT (card_instance_id) WHERE is_completed = false DO NOTHING RETURNING id`
- If `v_entry_id IS NULL` after insert (conflict occurred), select the existing entry ID and return it (no error)

No frontend changes needed.

