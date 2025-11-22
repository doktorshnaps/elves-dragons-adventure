-- Удаляем записи с NULL card_data
DELETE FROM card_instances WHERE card_data IS NULL;