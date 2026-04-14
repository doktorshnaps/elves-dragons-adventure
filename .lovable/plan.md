

## Problem

When resurrecting a card, the RPC function `resurrect_card_in_medical_bay` fails with "duplicate key value violates unique constraint idx_medical_bay_active_card" because:

1. The function checks `is_in_medical_bay` flag on `card_instances` (line 178)
2. But if the card already has an active (non-completed) row in `medical_bay`, the INSERT at line 202 fails
3. Before the INSERT, the function already deducted ELL and set `is_in_medical_bay = true` — so on failure, the user loses ELL but gets an error

This can happen due to race conditions or stale state where `is_in_medical_bay` was `false` but a `medical_bay` row still existed.

## Fix

**New SQL migration** — Update the `resurrect_card_in_medical_bay` function to:

1. Add an explicit check: if a non-completed `medical_bay` row already exists for this card, return early with a friendly error (no ELL deducted)
2. Add `ON CONFLICT (card_instance_id) WHERE is_completed = false DO NOTHING` to the INSERT as a safety net
3. After the INSERT, check if `v_medical_bay_id` is NULL (conflict occurred) — if so, rollback the ELL deduction by re-adding it

```sql
-- Before the ELL deduction, add:
IF EXISTS (SELECT 1 FROM medical_bay WHERE card_instance_id = p_card_instance_id::UUID AND is_completed = false) THEN
  RETURN json_build_object('success', false, 'error', 'Карточка уже воскрешается');
END IF;

-- Change INSERT to use ON CONFLICT:
INSERT INTO medical_bay (...)
VALUES (...)
ON CONFLICT (card_instance_id) WHERE is_completed = false DO NOTHING
RETURNING id INTO v_medical_bay_id;

-- After INSERT, check for conflict:
IF v_medical_bay_id IS NULL THEN
  -- Rollback: restore balance and card flag
  UPDATE game_data SET balance = balance + v_resurrection_cost WHERE wallet_address = p_wallet_address;
  UPDATE card_instances SET is_in_medical_bay = false WHERE id = p_card_instance_id::UUID;
  RETURN json_build_object('success', false, 'error', 'Карточка уже воскрешается');
END IF;
```

### Files
1. **New SQL migration** — Recreate `resurrect_card_in_medical_bay` with the duplicate protection

