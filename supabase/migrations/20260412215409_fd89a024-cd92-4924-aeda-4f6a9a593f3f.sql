-- 1. Drop the duplicate uuid overload for medical_bay
DROP FUNCTION IF EXISTS public.add_card_to_medical_bay(uuid, text);

-- 2. Enable realtime for forge_bay and medical_bay
ALTER PUBLICATION supabase_realtime ADD TABLE forge_bay;
ALTER PUBLICATION supabase_realtime ADD TABLE medical_bay;