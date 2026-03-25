CREATE OR REPLACE FUNCTION public.admin_update_item_exchange_settings(
  p_admin_wallet_address text,
  p_min_quests_per_day integer,
  p_max_quests_per_day integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_settings_id uuid;
BEGIN
  IF NOT public.is_admin_or_super_wallet(p_admin_wallet_address) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  IF p_min_quests_per_day < 1 OR p_max_quests_per_day < 1 OR p_min_quests_per_day > p_max_quests_per_day THEN
    RAISE EXCEPTION 'Invalid min/max quests per day';
  END IF;

  SELECT id
  INTO v_settings_id
  FROM public.item_exchange_settings
  ORDER BY updated_at DESC
  LIMIT 1;

  IF v_settings_id IS NULL THEN
    INSERT INTO public.item_exchange_settings (
      min_quests_per_day,
      max_quests_per_day,
      updated_by_wallet,
      updated_at
    )
    VALUES (
      p_min_quests_per_day,
      p_max_quests_per_day,
      p_admin_wallet_address,
      now()
    );

    RETURN true;
  END IF;

  UPDATE public.item_exchange_settings
  SET
    min_quests_per_day = p_min_quests_per_day,
    max_quests_per_day = p_max_quests_per_day,
    updated_at = now(),
    updated_by_wallet = p_admin_wallet_address
  WHERE id = v_settings_id;

  RETURN FOUND;
END;
$$;