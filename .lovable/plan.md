

# Fix: Medical Bay overload error + Forge Bay real-time sync

## Problem 1: Medical Bay "Could not choose the best candidate function"
Same issue we fixed for forge -- there are **two overloaded versions** of `add_card_to_medical_bay` (one with `text` param, one with `uuid`). PostgREST cannot resolve the ambiguity.

**Fix**: Drop the `uuid` version, keep only the `text` version (matching the forge fix pattern).

## Problem 2: Forge Bay not visible on other devices
The `forge_bay` and `medical_bay` tables are **not added to the Supabase Realtime publication**. Real-time subscriptions only work on the device that made the change because no events are broadcast to other clients.

**Fix**: Add both tables to the `supabase_realtime` publication.

## Technical Details

**Single migration** with:

```sql
-- 1. Drop the duplicate uuid overload for medical_bay
DROP FUNCTION IF EXISTS public.add_card_to_medical_bay(uuid, text);

-- 2. Enable realtime for forge_bay and medical_bay
ALTER PUBLICATION supabase_realtime ADD TABLE forge_bay;
ALTER PUBLICATION supabase_realtime ADD TABLE medical_bay;
```

No frontend changes needed -- both hooks already subscribe to real-time changes correctly.

