-- Make ensure_game_data_exists idempotent to avoid 409 conflicts under concurrency
CREATE OR REPLACE FUNCTION public.ensure_game_data_exists(p_wallet_address text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid;
  existing_record RECORD;
BEGIN
  IF p_wallet_address IS NULL OR length(trim(p_wallet_address)) = 0 THEN
    RAISE EXCEPTION 'wallet address required';
  END IF;

  -- Try to load existing
  SELECT * INTO existing_record
  FROM public.game_data 
  WHERE wallet_address = p_wallet_address
  LIMIT 1;

  IF existing_record IS NOT NULL THEN
    RETURN existing_record.user_id;
  END IF;

  -- Create new with UPSERT semantics to avoid race 409
  v_user_id := gen_random_uuid();
  INSERT INTO public.game_data (
    user_id,
    wallet_address,
    balance,
    cards,
    inventory,
    selected_team,
    dragon_eggs,
    account_level,
    account_experience,
    initialized,
    marketplace_listings,
    social_quests,
    barracks_upgrades,
    dragon_lair_upgrades
  ) VALUES (
    v_user_id,
    p_wallet_address,
    0,
    '[]'::jsonb,
    '[]'::jsonb,
    '[]'::jsonb,
    '[]'::jsonb,
    1,
    0,
    true,
    '[]'::jsonb,
    '[]'::jsonb,
    '[]'::jsonb,
    '[]'::jsonb
  )
  ON CONFLICT (wallet_address) DO NOTHING;

  -- Return the created or existing id
  IF NOT FOUND THEN
    SELECT user_id INTO v_user_id FROM public.game_data WHERE wallet_address = p_wallet_address LIMIT 1;
  END IF;

  RETURN v_user_id;
END;
$function$;