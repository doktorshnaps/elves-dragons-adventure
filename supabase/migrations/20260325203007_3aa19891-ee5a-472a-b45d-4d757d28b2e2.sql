-- Admin RPC: get templates
CREATE OR REPLACE FUNCTION public.admin_get_item_exchange_templates(
  p_admin_wallet_address TEXT
)
RETURNS TABLE (
  id UUID,
  title_ru TEXT,
  title_en TEXT,
  description_ru TEXT,
  description_en TEXT,
  icon TEXT,
  required_items JSONB,
  reward_items JSONB,
  reward_ell INTEGER,
  weight INTEGER,
  min_level INTEGER,
  is_active BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_admin_or_super_wallet(p_admin_wallet_address) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT
    t.id,
    t.title_ru,
    t.title_en,
    t.description_ru,
    t.description_en,
    t.icon,
    t.required_items,
    t.reward_items,
    t.reward_ell,
    t.weight,
    t.min_level,
    t.is_active,
    t.created_at,
    t.updated_at
  FROM public.item_exchange_templates t
  ORDER BY t.title_ru;
END;
$$;

-- Admin RPC: get settings
CREATE OR REPLACE FUNCTION public.admin_get_item_exchange_settings(
  p_admin_wallet_address TEXT
)
RETURNS TABLE (
  id UUID,
  min_quests_per_day INTEGER,
  max_quests_per_day INTEGER,
  updated_at TIMESTAMPTZ,
  updated_by_wallet TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_admin_or_super_wallet(p_admin_wallet_address) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT s.id, s.min_quests_per_day, s.max_quests_per_day, s.updated_at, s.updated_by_wallet
  FROM public.item_exchange_settings s
  LIMIT 1;
END;
$$;

-- Admin RPC: upsert template
CREATE OR REPLACE FUNCTION public.admin_upsert_item_exchange_template(
  p_admin_wallet_address TEXT,
  p_id UUID,
  p_title_ru TEXT,
  p_title_en TEXT,
  p_description_ru TEXT,
  p_description_en TEXT,
  p_icon TEXT,
  p_required_items JSONB,
  p_reward_items JSONB,
  p_reward_ell INTEGER,
  p_weight INTEGER,
  p_min_level INTEGER,
  p_is_active BOOLEAN
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  IF NOT is_admin_or_super_wallet(p_admin_wallet_address) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  IF p_weight < 1 THEN
    RAISE EXCEPTION 'weight must be >= 1';
  END IF;

  IF p_min_level < 1 THEN
    RAISE EXCEPTION 'min_level must be >= 1';
  END IF;

  IF p_id IS NULL THEN
    INSERT INTO public.item_exchange_templates (
      title_ru,
      title_en,
      description_ru,
      description_en,
      icon,
      required_items,
      reward_items,
      reward_ell,
      weight,
      min_level,
      is_active,
      updated_at
    ) VALUES (
      p_title_ru,
      p_title_en,
      COALESCE(p_description_ru, ''),
      COALESCE(p_description_en, ''),
      COALESCE(NULLIF(p_icon, ''), '📦'),
      COALESCE(p_required_items, '[]'::jsonb),
      COALESCE(p_reward_items, '[]'::jsonb),
      COALESCE(p_reward_ell, 0),
      COALESCE(p_weight, 5),
      COALESCE(p_min_level, 1),
      COALESCE(p_is_active, true),
      now()
    )
    RETURNING id INTO v_id;
  ELSE
    UPDATE public.item_exchange_templates
    SET
      title_ru = p_title_ru,
      title_en = p_title_en,
      description_ru = COALESCE(p_description_ru, ''),
      description_en = COALESCE(p_description_en, ''),
      icon = COALESCE(NULLIF(p_icon, ''), '📦'),
      required_items = COALESCE(p_required_items, '[]'::jsonb),
      reward_items = COALESCE(p_reward_items, '[]'::jsonb),
      reward_ell = COALESCE(p_reward_ell, 0),
      weight = COALESCE(p_weight, 5),
      min_level = COALESCE(p_min_level, 1),
      is_active = COALESCE(p_is_active, true),
      updated_at = now()
    WHERE id = p_id
    RETURNING id INTO v_id;

    IF v_id IS NULL THEN
      RAISE EXCEPTION 'Template not found';
    END IF;
  END IF;

  RETURN v_id;
END;
$$;

-- Admin RPC: delete template
CREATE OR REPLACE FUNCTION public.admin_delete_item_exchange_template(
  p_admin_wallet_address TEXT,
  p_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_admin_or_super_wallet(p_admin_wallet_address) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  DELETE FROM public.item_exchange_templates WHERE id = p_id;
  RETURN FOUND;
END;
$$;

-- Admin RPC: update settings
CREATE OR REPLACE FUNCTION public.admin_update_item_exchange_settings(
  p_admin_wallet_address TEXT,
  p_min_quests_per_day INTEGER,
  p_max_quests_per_day INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_admin_or_super_wallet(p_admin_wallet_address) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  IF p_min_quests_per_day < 1 OR p_max_quests_per_day < 1 OR p_min_quests_per_day > p_max_quests_per_day THEN
    RAISE EXCEPTION 'Invalid min/max quests per day';
  END IF;

  UPDATE public.item_exchange_settings
  SET
    min_quests_per_day = p_min_quests_per_day,
    max_quests_per_day = p_max_quests_per_day,
    updated_at = now(),
    updated_by_wallet = p_admin_wallet_address;

  RETURN FOUND;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_get_item_exchange_templates(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_item_exchange_settings(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_upsert_item_exchange_template(TEXT, UUID, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB, JSONB, INTEGER, INTEGER, INTEGER, BOOLEAN) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_item_exchange_template(TEXT, UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_item_exchange_settings(TEXT, INTEGER, INTEGER) TO anon, authenticated;