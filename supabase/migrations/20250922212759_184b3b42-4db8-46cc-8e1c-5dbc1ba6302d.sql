-- Создаем уникальное ограничение для предотвращения дубликатов card_instances
ALTER TABLE card_instances 
ADD CONSTRAINT unique_card_instance_per_wallet 
UNIQUE (wallet_address, card_template_id);

-- Создаем индекс для оптимизации запросов
CREATE INDEX IF NOT EXISTS idx_card_instances_wallet_template 
ON card_instances (wallet_address, card_template_id);