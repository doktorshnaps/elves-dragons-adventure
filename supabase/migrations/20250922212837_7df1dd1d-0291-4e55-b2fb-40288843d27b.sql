-- Удаляем ВСЕ дублированные записи из card_instances для всех пользователей
WITH duplicates AS (
  SELECT id, 
         ROW_NUMBER() OVER (
           PARTITION BY wallet_address, card_template_id 
           ORDER BY created_at ASC
         ) as rn
  FROM card_instances
)
DELETE FROM card_instances 
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- Теперь создаем уникальное ограничение
ALTER TABLE card_instances 
ADD CONSTRAINT unique_card_instance_per_wallet 
UNIQUE (wallet_address, card_template_id);

-- Создаем индекс для оптимизации запросов
CREATE INDEX IF NOT EXISTS idx_card_instances_wallet_template 
ON card_instances (wallet_address, card_template_id);