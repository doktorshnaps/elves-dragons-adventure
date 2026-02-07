-- Clean up duplicate admin-given cards (keep only one of each duplicate pair)
DELETE FROM card_instances
WHERE id IN (
  SELECT id FROM (
    SELECT id, 
           ROW_NUMBER() OVER (PARTITION BY (card_data::jsonb)->>'id' ORDER BY created_at ASC) as rn
    FROM card_instances
    WHERE wallet_address = 'mr_bruts.tg'
      AND (card_data::jsonb)->>'id' LIKE 'admin-%'
  ) sub
  WHERE rn > 1
);