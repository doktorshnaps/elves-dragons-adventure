-- Create RPC function for admin to create card upgrade requirements
CREATE OR REPLACE FUNCTION public.admin_create_card_upgrade_requirement(
  p_wallet_address TEXT,
  p_card_type TEXT,
  p_rarity TEXT,
  p_from_rarity INTEGER,
  p_to_rarity INTEGER,
  p_card_class TEXT DEFAULT NULL,
  p_faction TEXT DEFAULT NULL,
  p_success_chance INTEGER DEFAULT 50,
  p_cost_ell INTEGER DEFAULT 0,
  p_cost_wood INTEGER DEFAULT 0,
  p_cost_stone INTEGER DEFAULT 0,
  p_cost_iron INTEGER DEFAULT 0,
  p_cost_gold INTEGER DEFAULT 0,
  p_required_defeated_monsters INTEGER DEFAULT 0,
  p_required_items JSONB DEFAULT '[]'::jsonb,
  p_required_building_id TEXT DEFAULT NULL,
  p_required_building_level INTEGER DEFAULT 0
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_id UUID;
BEGIN
  -- Check if user is admin
  IF NOT is_admin_or_super_wallet(p_wallet_address) THEN
    RAISE EXCEPTION 'Access denied: admin privileges required';
  END IF;
  
  -- Insert the new requirement
  INSERT INTO card_upgrade_requirements (
    card_type,
    card_class,
    faction,
    rarity,
    from_rarity,
    to_rarity,
    success_chance,
    cost_ell,
    cost_wood,
    cost_stone,
    cost_iron,
    cost_gold,
    required_defeated_monsters,
    required_items,
    required_building_id,
    required_building_level,
    created_by_wallet_address,
    is_active
  ) VALUES (
    p_card_type,
    p_card_class,
    p_faction,
    p_rarity,
    p_from_rarity,
    p_to_rarity,
    p_success_chance,
    p_cost_ell,
    p_cost_wood,
    p_cost_stone,
    p_cost_iron,
    p_cost_gold,
    p_required_defeated_monsters,
    p_required_items,
    p_required_building_id,
    p_required_building_level,
    p_wallet_address,
    true
  )
  RETURNING id INTO v_new_id;
  
  RETURN v_new_id;
END;
$$;

-- Create RPC function for admin to update card upgrade requirements
CREATE OR REPLACE FUNCTION public.admin_update_card_upgrade_requirement(
  p_wallet_address TEXT,
  p_id UUID,
  p_success_chance INTEGER DEFAULT NULL,
  p_cost_ell INTEGER DEFAULT NULL,
  p_cost_wood INTEGER DEFAULT NULL,
  p_cost_stone INTEGER DEFAULT NULL,
  p_cost_iron INTEGER DEFAULT NULL,
  p_cost_gold INTEGER DEFAULT NULL,
  p_required_defeated_monsters INTEGER DEFAULT NULL,
  p_required_items JSONB DEFAULT NULL,
  p_required_building_id TEXT DEFAULT NULL,
  p_required_building_level INTEGER DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user is admin
  IF NOT is_admin_or_super_wallet(p_wallet_address) THEN
    RAISE EXCEPTION 'Access denied: admin privileges required';
  END IF;
  
  -- Update the requirement
  UPDATE card_upgrade_requirements
  SET
    success_chance = COALESCE(p_success_chance, success_chance),
    cost_ell = COALESCE(p_cost_ell, cost_ell),
    cost_wood = COALESCE(p_cost_wood, cost_wood),
    cost_stone = COALESCE(p_cost_stone, cost_stone),
    cost_iron = COALESCE(p_cost_iron, cost_iron),
    cost_gold = COALESCE(p_cost_gold, cost_gold),
    required_defeated_monsters = COALESCE(p_required_defeated_monsters, required_defeated_monsters),
    required_items = COALESCE(p_required_items, required_items),
    required_building_id = p_required_building_id,
    required_building_level = COALESCE(p_required_building_level, required_building_level),
    updated_at = now()
  WHERE id = p_id;
  
  RETURN FOUND;
END;
$$;