-- Оптимизация RPC функций с JOIN'ами для устранения N+1 queries

-- ============= Оптимизированная get_card_instances_by_wallet =============
CREATE OR REPLACE FUNCTION public.get_card_instances_by_wallet_optimized(p_wallet_address text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', ci.id,
      'user_id', ci.user_id,
      'wallet_address', ci.wallet_address,
      'card_template_id', ci.card_template_id,
      'card_type', ci.card_type,
      'current_health', ci.current_health,
      'max_health', ci.max_health,
      'current_defense', ci.current_defense,
      'max_defense', ci.max_defense,
      'max_power', ci.max_power,
      'max_magic', ci.max_magic,
      'last_heal_time', ci.last_heal_time,
      'is_in_medical_bay', ci.is_in_medical_bay,
      'medical_bay_start_time', ci.medical_bay_start_time,
      'medical_bay_heal_rate', ci.medical_bay_heal_rate,
      'monster_kills', ci.monster_kills,
      'card_data', ci.card_data,
      'created_at', ci.created_at,
      'updated_at', ci.updated_at,
      'nft_contract_id', ci.nft_contract_id,
      'nft_token_id', ci.nft_token_id,
      'template_info', CASE 
        WHEN ci.card_type = 'workers' AND it.id IS NOT NULL THEN
          jsonb_build_object(
            'id', it.id,
            'item_id', it.item_id,
            'name', it.name,
            'description', it.description,
            'image_url', it.image_url,
            'stats', it.stats,
            'value', it.value,
            'sell_price', it.sell_price,
            'rarity', it.rarity
          )
        ELSE NULL
      END
    )
  )
  INTO v_result
  FROM card_instances ci
  LEFT JOIN item_templates it ON 
    ci.card_type = 'workers' 
    AND ci.card_template_id = it.item_id
  WHERE ci.wallet_address = p_wallet_address
    AND ci.is_on_marketplace IS NOT TRUE;

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;

-- ============= Индексы для оптимизации JOIN'ов =============
CREATE INDEX IF NOT EXISTS idx_card_instances_template_id 
ON card_instances(card_template_id) 
WHERE card_type = 'workers';

CREATE INDEX IF NOT EXISTS idx_card_instances_wallet_marketplace 
ON card_instances(wallet_address, is_on_marketplace) 
WHERE is_on_marketplace IS NOT TRUE;

CREATE INDEX IF NOT EXISTS idx_item_instances_wallet 
ON item_instances(wallet_address);

CREATE INDEX IF NOT EXISTS idx_medical_bay_wallet_completed 
ON medical_bay(wallet_address, is_completed) 
WHERE is_completed = false;

CREATE INDEX IF NOT EXISTS idx_forge_bay_wallet_completed 
ON forge_bay(wallet_address, is_completed) 
WHERE is_completed = false;