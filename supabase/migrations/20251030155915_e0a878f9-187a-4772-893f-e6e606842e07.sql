-- СТРОГИЙ маппинг NFT карт: ТОЛЬКО карты со словом "dragon" или "дракон" - драконы, остальные - герои

-- Fix user_nft_cards table
UPDATE user_nft_cards
SET 
  nft_metadata = jsonb_set(
    nft_metadata, 
    '{type}', 
    CASE 
      WHEN (
        LOWER(card_template_name) LIKE '%dragon%' 
        OR LOWER(card_template_name) LIKE '%дракон%'
        OR LOWER(nft_metadata->>'description') LIKE '%dragon%'
        OR LOWER(nft_metadata->>'description') LIKE '%дракон%'
      ) THEN '"dragon"'::jsonb
      ELSE '"hero"'::jsonb
    END
  ),
  updated_at = now()
WHERE nft_contract_id IS NOT NULL;

-- Fix card_instances table
UPDATE card_instances
SET 
  card_type = CASE 
    WHEN (
      LOWER(card_data->>'name') LIKE '%dragon%' 
      OR LOWER(card_data->>'name') LIKE '%дракон%'
      OR LOWER(card_data->>'description') LIKE '%dragon%'
      OR LOWER(card_data->>'description') LIKE '%дракон%'
    ) THEN 'dragon'
    ELSE 'hero'
  END,
  card_data = jsonb_set(
    card_data,
    '{type}',
    CASE 
      WHEN (
        LOWER(card_data->>'name') LIKE '%dragon%' 
        OR LOWER(card_data->>'name') LIKE '%дракон%'
        OR LOWER(card_data->>'description') LIKE '%dragon%'
        OR LOWER(card_data->>'description') LIKE '%дракон%'
      ) THEN '"pet"'::jsonb
      ELSE '"character"'::jsonb
    END
  ),
  updated_at = now()
WHERE nft_contract_id IS NOT NULL
  AND nft_token_id IS NOT NULL;

-- Log the changes
DO $$
DECLARE
  nft_cards_count INTEGER;
  card_instances_count INTEGER;
  dragons_count INTEGER;
  heroes_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO nft_cards_count
  FROM user_nft_cards
  WHERE updated_at > now() - INTERVAL '5 seconds';
  
  SELECT COUNT(*) INTO card_instances_count
  FROM card_instances
  WHERE nft_contract_id IS NOT NULL 
    AND updated_at > now() - INTERVAL '5 seconds';
  
  SELECT COUNT(*) INTO dragons_count
  FROM card_instances
  WHERE nft_contract_id IS NOT NULL 
    AND card_type = 'dragon';
    
  SELECT COUNT(*) INTO heroes_count
  FROM card_instances
  WHERE nft_contract_id IS NOT NULL 
    AND card_type = 'hero';
  
  RAISE NOTICE 'Updated % NFT cards in user_nft_cards', nft_cards_count;
  RAISE NOTICE 'Updated % NFT cards in card_instances', card_instances_count;
  RAISE NOTICE 'Total NFT dragons: %, heroes: %', dragons_count, heroes_count;
END $$;