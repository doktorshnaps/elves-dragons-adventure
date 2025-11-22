-- Обновить max_defense и current_defense для всех существующих card_instances
-- На основе значения defense из card_data

UPDATE card_instances
SET 
  max_defense = COALESCE(
    CAST((card_data->>'defense') AS INTEGER),
    0
  ),
  current_defense = COALESCE(
    CAST((card_data->>'defense') AS INTEGER),
    current_defense -- Сохраняем текущий current_defense если он уже был установлен
  )
WHERE max_defense = 0 OR max_defense IS NULL;