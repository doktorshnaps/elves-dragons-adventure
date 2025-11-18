-- Синхронизация карт из game_data в card_instances для игрока superalexzis-hot1.tg
-- Используем INSERT ... SELECT для гарантированного выполнения

INSERT INTO public.card_instances (
  wallet_address,
  user_id,
  card_template_id,
  card_type,
  current_health,
  max_health,
  last_heal_time,
  card_data,
  monster_kills
)
SELECT
  gd.wallet_address,
  gd.user_id,
  card_json->>'id' as card_template_id,
  CASE 
    WHEN card_json->>'type' = 'pet' THEN 'dragon'
    WHEN card_json->>'type' IN ('worker','workers') THEN 'workers'
    ELSE 'hero' 
  END as card_type,
  LEAST(
    COALESCE((card_json->>'currentHealth')::integer, COALESCE((card_json->>'health')::integer, 100)),
    COALESCE((card_json->>'health')::integer, 100)
  ) as current_health,
  COALESCE((card_json->>'health')::integer, 100) as max_health,
  now() as last_heal_time,
  card_json as card_data,
  0 as monster_kills
FROM public.game_data gd,
     jsonb_array_elements(gd.cards) as card_json
WHERE gd.wallet_address = 'superalexzis-hot1.tg'
ON CONFLICT (wallet_address, card_template_id) DO NOTHING;