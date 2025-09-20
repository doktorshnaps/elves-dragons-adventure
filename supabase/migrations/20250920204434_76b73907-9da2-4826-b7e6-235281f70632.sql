-- Очищаем дублирующиеся записи "Пылевой Батрак" из inventory
UPDATE game_data 
SET inventory = (
  SELECT jsonb_agg(DISTINCT item) 
  FROM jsonb_array_elements(inventory) AS item
  WHERE (item->>'name' != 'Пылевой Батрак' OR item->>'type' != 'worker')
)
WHERE wallet_address = 'mr_bruts.tg';