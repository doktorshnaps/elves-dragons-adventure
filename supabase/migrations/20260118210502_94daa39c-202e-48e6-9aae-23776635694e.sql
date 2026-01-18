
-- Fix stuck is_in_medical_bay flags for player me4enyi1.tg
-- Cards that have the flag true but are NOT actually in any bay

-- Reset stuck flags for specific cards
UPDATE public.card_instances
SET is_in_medical_bay = false,
    updated_at = now()
WHERE id IN ('d4deb1d0-b804-4e43-ac37-282a5b1ecb01', 'b51b97a4-4a72-41b8-909b-a729d77237d0')
  AND wallet_address = 'me4enyi1.tg'
  AND NOT EXISTS (
    SELECT 1 FROM medical_bay mb 
    WHERE mb.card_instance_id = card_instances.id 
    AND mb.is_completed = false
  )
  AND NOT EXISTS (
    SELECT 1 FROM forge_bay fb 
    WHERE fb.card_instance_id = card_instances.id 
    AND fb.is_completed = false
  );

-- Also run the cleanup function for any other stuck flags globally
SELECT public.cleanup_stuck_medical_bay_flags();
