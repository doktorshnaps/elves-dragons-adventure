-- Добавляем поля для текущей и максимальной брони к card_instances
ALTER TABLE card_instances 
ADD COLUMN current_defense integer NOT NULL DEFAULT 0,
ADD COLUMN max_defense integer NOT NULL DEFAULT 0;

-- Инициализируем текущую броню из card_data для существующих карточек
UPDATE card_instances
SET 
  current_defense = COALESCE((card_data->>'defense')::integer, 0),
  max_defense = COALESCE((card_data->>'defense')::integer, 0)
WHERE current_defense = 0 AND max_defense = 0;

-- Добавляем индекс для быстрого поиска карточек с пониженной броней
CREATE INDEX idx_card_instances_defense ON card_instances(current_defense) 
WHERE current_defense < max_defense;