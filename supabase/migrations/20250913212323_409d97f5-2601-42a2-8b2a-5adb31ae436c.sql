-- Admin functions for viewing and managing player cards and inventory

-- Function to get player's cards
CREATE OR REPLACE FUNCTION public.admin_get_player_cards(
  p_user_id uuid,
  p_admin_wallet_address text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  player_cards jsonb;
BEGIN
  -- Check if caller is admin
  IF p_admin_wallet_address != 'mr_bruts.tg' THEN
    RAISE EXCEPTION 'Unauthorized: Only admin can view player cards';
  END IF;

  -- Get player's cards
  SELECT COALESCE(cards, '[]'::jsonb) INTO player_cards
  FROM public.game_data
  WHERE user_id = p_user_id;

  IF player_cards IS NULL THEN
    RAISE EXCEPTION 'Player not found: %', p_user_id;
  END IF;

  RETURN player_cards;
END;
$$;

-- Function to get player's inventory
CREATE OR REPLACE FUNCTION public.admin_get_player_inventory(
  p_user_id uuid,
  p_admin_wallet_address text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  player_inventory jsonb;
BEGIN
  -- Check if caller is admin
  IF p_admin_wallet_address != 'mr_bruts.tg' THEN
    RAISE EXCEPTION 'Unauthorized: Only admin can view player inventory';
  END IF;

  -- Get player's inventory
  SELECT COALESCE(inventory, '[]'::jsonb) INTO player_inventory
  FROM public.game_data
  WHERE user_id = p_user_id;

  IF player_inventory IS NULL THEN
    RAISE EXCEPTION 'Player not found: %', p_user_id;
  END IF;

  RETURN player_inventory;
END;
$$;

-- Function to add card to player
CREATE OR REPLACE FUNCTION public.admin_give_player_card(
  p_user_id uuid,
  p_card_data jsonb,
  p_admin_wallet_address text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Check if caller is admin
  IF p_admin_wallet_address != 'mr_bruts.tg' THEN
    RAISE EXCEPTION 'Unauthorized: Only admin can give cards to players';
  END IF;

  -- Check if player exists
  IF NOT EXISTS (SELECT 1 FROM public.game_data WHERE user_id = p_user_id) THEN
    RAISE EXCEPTION 'Player not found: %', p_user_id;
  END IF;

  -- Add card to player's deck
  UPDATE public.game_data
  SET cards = COALESCE(cards, '[]'::jsonb) || jsonb_build_array(p_card_data),
      updated_at = now()
  WHERE user_id = p_user_id;

  RETURN TRUE;
END;
$$;

-- Function to add item to player inventory
CREATE OR REPLACE FUNCTION public.admin_give_player_item(
  p_user_id uuid,
  p_item_data jsonb,
  p_admin_wallet_address text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Check if caller is admin
  IF p_admin_wallet_address != 'mr_bruts.tg' THEN
    RAISE EXCEPTION 'Unauthorized: Only admin can give items to players';
  END IF;

  -- Check if player exists
  IF NOT EXISTS (SELECT 1 FROM public.game_data WHERE user_id = p_user_id) THEN
    RAISE EXCEPTION 'Player not found: %', p_user_id;
  END IF;

  -- Add item to player's inventory
  UPDATE public.game_data
  SET inventory = COALESCE(inventory, '[]'::jsonb) || jsonb_build_array(p_item_data),
      updated_at = now()
  WHERE user_id = p_user_id;

  RETURN TRUE;
END;
$$;

-- Function to set player balance (not just add)
CREATE OR REPLACE FUNCTION public.admin_set_player_balance(
  p_user_id uuid,
  p_balance integer,
  p_admin_wallet_address text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Check if caller is admin
  IF p_admin_wallet_address != 'mr_bruts.tg' THEN
    RAISE EXCEPTION 'Unauthorized: Only admin can set player balance';
  END IF;

  -- Check if player exists
  IF NOT EXISTS (SELECT 1 FROM public.game_data WHERE user_id = p_user_id) THEN
    RAISE EXCEPTION 'Player not found: %', p_user_id;
  END IF;

  -- Set player balance
  UPDATE public.game_data
  SET balance = p_balance,
      updated_at = now()
  WHERE user_id = p_user_id;

  RETURN TRUE;
END;
$$;