
-- Clean up completed forge_bay entries for me4enyi1.tg
DELETE FROM forge_bay 
WHERE wallet_address = 'me4enyi1.tg' 
AND is_completed = true;

-- Reset stuck is_in_medical_bay flags for cards that are NOT in medical_bay or forge_bay
UPDATE card_instances ci
SET is_in_medical_bay = false
WHERE ci.wallet_address = 'me4enyi1.tg'
AND ci.is_in_medical_bay = true
AND NOT EXISTS (SELECT 1 FROM medical_bay mb WHERE mb.card_instance_id = ci.id)
AND NOT EXISTS (SELECT 1 FROM forge_bay fb WHERE fb.card_instance_id = ci.id);
