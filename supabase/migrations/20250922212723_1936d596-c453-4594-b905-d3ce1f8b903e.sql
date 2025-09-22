-- Удаляем дублированные записи из card_instances, оставляя только одну запись для каждого card_template_id
WITH duplicates AS (
  SELECT id, 
         ROW_NUMBER() OVER (
           PARTITION BY wallet_address, card_template_id 
           ORDER BY created_at ASC
         ) as rn
  FROM card_instances
  WHERE wallet_address = 'mr_bruts.tg'
)
DELETE FROM card_instances 
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- Проверяем результат
SELECT 
  wallet_address,
  card_template_id,
  card_type,
  COUNT(*) as count
FROM card_instances 
WHERE wallet_address = 'mr_bruts.tg'
GROUP BY wallet_address, card_template_id, card_type
HAVING COUNT(*) > 1;