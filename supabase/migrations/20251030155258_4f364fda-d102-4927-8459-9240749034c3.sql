-- Fix incorrect NFT card types in user_nft_cards table
-- Update cards with hero keywords from 'dragon' to 'hero'
UPDATE user_nft_cards
SET 
  nft_metadata = jsonb_set(
    nft_metadata, 
    '{type}', 
    '"hero"'::jsonb
  ),
  updated_at = now()
WHERE 
  (nft_metadata->>'type' = 'dragon' OR nft_metadata->>'type' = 'pet')
  AND (
    -- Priority hero keywords
    LOWER(card_template_name) LIKE '%strategist%'
    OR LOWER(card_template_name) LIKE '%warrior%'
    OR LOWER(card_template_name) LIKE '%knight%'
    -- Additional hero keywords
    OR LOWER(card_template_name) LIKE '%стратег%'
    OR LOWER(card_template_name) LIKE '%воин%'
    OR LOWER(card_template_name) LIKE '%рыцарь%'
    OR LOWER(card_template_name) LIKE '%mage%'
    OR LOWER(card_template_name) LIKE '%маг%'
    OR LOWER(card_template_name) LIKE '%guard%'
    OR LOWER(card_template_name) LIKE '%страж%'
    OR LOWER(card_template_name) LIKE '%defender%'
    OR LOWER(card_template_name) LIKE '%защитник%'
    OR LOWER(card_template_name) LIKE '%healer%'
    OR LOWER(card_template_name) LIKE '%целитель%'
    OR LOWER(card_template_name) LIKE '%veteran%'
    OR LOWER(card_template_name) LIKE '%ветеран%'
    OR LOWER(card_template_name) LIKE '%recruit%'
    OR LOWER(card_template_name) LIKE '%рекрут%'
    OR LOWER(card_template_name) LIKE '%hero%'
    OR LOWER(card_template_name) LIKE '%герой%'
  );

-- Fix incorrect NFT card types in card_instances table
-- Update card_type from 'dragon' to 'hero' for hero cards
UPDATE card_instances
SET 
  card_type = 'hero',
  card_data = jsonb_set(
    card_data,
    '{type}',
    '"character"'::jsonb
  ),
  updated_at = now()
WHERE 
  nft_contract_id IS NOT NULL
  AND nft_token_id IS NOT NULL
  AND card_type IN ('dragon', 'pet')
  AND (
    -- Priority hero keywords in card_data name
    LOWER(card_data->>'name') LIKE '%strategist%'
    OR LOWER(card_data->>'name') LIKE '%warrior%'
    OR LOWER(card_data->>'name') LIKE '%knight%'
    -- Additional hero keywords
    OR LOWER(card_data->>'name') LIKE '%стратег%'
    OR LOWER(card_data->>'name') LIKE '%воин%'
    OR LOWER(card_data->>'name') LIKE '%рыцарь%'
    OR LOWER(card_data->>'name') LIKE '%mage%'
    OR LOWER(card_data->>'name') LIKE '%маг%'
    OR LOWER(card_data->>'name') LIKE '%guard%'
    OR LOWER(card_data->>'name') LIKE '%страж%'
    OR LOWER(card_data->>'name') LIKE '%defender%'
    OR LOWER(card_data->>'name') LIKE '%защитник%'
    OR LOWER(card_data->>'name') LIKE '%healer%'
    OR LOWER(card_data->>'name') LIKE '%целитель%'
    OR LOWER(card_data->>'name') LIKE '%veteran%'
    OR LOWER(card_data->>'name') LIKE '%ветеран%'
    OR LOWER(card_data->>'name') LIKE '%recruit%'
    OR LOWER(card_data->>'name') LIKE '%рекрут%'
    OR LOWER(card_data->>'name') LIKE '%hero%'
    OR LOWER(card_data->>'name') LIKE '%герой%'
  );

-- Log the changes
DO $$
DECLARE
  nft_cards_updated INTEGER;
  card_instances_updated INTEGER;
BEGIN
  GET DIAGNOSTICS nft_cards_updated = ROW_COUNT;
  
  SELECT COUNT(*) INTO card_instances_updated
  FROM card_instances
  WHERE 
    nft_contract_id IS NOT NULL
    AND card_type = 'hero'
    AND updated_at > now() - INTERVAL '1 minute';
  
  RAISE NOTICE 'Fixed % NFT cards in user_nft_cards', nft_cards_updated;
  RAISE NOTICE 'Fixed % NFT cards in card_instances', card_instances_updated;
END $$;