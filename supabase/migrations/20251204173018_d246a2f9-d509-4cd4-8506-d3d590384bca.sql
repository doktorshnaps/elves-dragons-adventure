-- Delete all duplicate entries, keeping only the newest one per card_instance_id
DELETE FROM forge_bay fb1
WHERE id NOT IN (
  SELECT DISTINCT ON (card_instance_id) id 
  FROM forge_bay 
  ORDER BY card_instance_id, created_at DESC
);

-- Now add unique constraint
ALTER TABLE forge_bay DROP CONSTRAINT IF EXISTS forge_bay_card_instance_unique;
ALTER TABLE forge_bay ADD CONSTRAINT forge_bay_card_instance_unique UNIQUE (card_instance_id);