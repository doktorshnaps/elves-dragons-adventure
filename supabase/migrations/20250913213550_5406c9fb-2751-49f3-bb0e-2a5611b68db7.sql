-- Add admin functions to remove items and cards from players
CREATE OR REPLACE FUNCTION public.admin_remove_player_card(
  p_user_id uuid, 
  p_card_id text, 
  p_admin_wallet_address text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Check if caller is admin
  IF p_admin_wallet_address != 'mr_bruts.tg' THEN
    RAISE EXCEPTION 'Unauthorized: Only admin can remove cards from players';
  END IF;

  -- Check if player exists
  IF NOT EXISTS (SELECT 1 FROM public.game_data WHERE user_id = p_user_id) THEN
    RAISE EXCEPTION 'Player not found: %', p_user_id;
  END IF;

  -- Remove card from player's deck
  UPDATE public.game_data
  SET cards = (
    SELECT COALESCE(jsonb_agg(elem), '[]'::jsonb)
    FROM jsonb_array_elements(COALESCE(cards, '[]'::jsonb)) AS e(elem)
    WHERE e.elem->>'id' != p_card_id
  ),
  updated_at = now()
  WHERE user_id = p_user_id;

  RETURN TRUE;
END;
$function$;

CREATE OR REPLACE FUNCTION public.admin_remove_player_item(
  p_user_id uuid, 
  p_item_id text, 
  p_admin_wallet_address text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Check if caller is admin
  IF p_admin_wallet_address != 'mr_bruts.tg' THEN
    RAISE EXCEPTION 'Unauthorized: Only admin can remove items from players';
  END IF;

  -- Check if player exists
  IF NOT EXISTS (SELECT 1 FROM public.game_data WHERE user_id = p_user_id) THEN
    RAISE EXCEPTION 'Player not found: %', p_user_id;
  END IF;

  -- Remove item from player's inventory
  UPDATE public.game_data
  SET inventory = (
    SELECT COALESCE(jsonb_agg(elem), '[]'::jsonb)
    FROM jsonb_array_elements(COALESCE(inventory, '[]'::jsonb)) AS e(elem)
    WHERE e.elem->>'id' != p_item_id
  ),
  updated_at = now()
  WHERE user_id = p_user_id;

  RETURN TRUE;
END;
$function$;