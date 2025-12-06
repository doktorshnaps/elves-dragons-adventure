-- Удаляем дубликаты из medical_bay, оставляя самую раннюю запись
DELETE FROM medical_bay 
WHERE id NOT IN (
  SELECT DISTINCT ON (card_instance_id) id 
  FROM medical_bay 
  ORDER BY card_instance_id, placed_at ASC
);

-- Добавляем UNIQUE constraint только для medical_bay (forge_bay уже имеет)
ALTER TABLE medical_bay 
ADD CONSTRAINT medical_bay_card_instance_unique UNIQUE (card_instance_id);