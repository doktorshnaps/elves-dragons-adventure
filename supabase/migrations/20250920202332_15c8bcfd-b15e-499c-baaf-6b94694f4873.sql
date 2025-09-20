-- Удаляем дублированные card_instances с UUID ID для рабочих
DELETE FROM card_instances 
WHERE wallet_address = 'mr_bruts.tg' 
  AND card_type = 'workers'
  AND card_template_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';