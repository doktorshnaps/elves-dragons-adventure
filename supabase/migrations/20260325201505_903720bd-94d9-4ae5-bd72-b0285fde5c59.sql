
-- 1. Table: item_exchange_templates
CREATE TABLE public.item_exchange_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_ru TEXT NOT NULL,
  title_en TEXT NOT NULL,
  description_ru TEXT NOT NULL DEFAULT '',
  description_en TEXT NOT NULL DEFAULT '',
  icon TEXT DEFAULT '📦',
  required_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  reward_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  reward_ell INTEGER NOT NULL DEFAULT 0,
  weight INTEGER NOT NULL DEFAULT 5,
  min_level INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.item_exchange_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active exchange templates"
  ON public.item_exchange_templates FOR SELECT
  TO public USING (is_active = true);

CREATE POLICY "Admins can view all exchange templates"
  ON public.item_exchange_templates FOR SELECT
  TO public USING (is_admin_or_super_wallet(get_current_user_wallet()));

CREATE POLICY "Admins can insert exchange templates"
  ON public.item_exchange_templates FOR INSERT
  TO public WITH CHECK (is_admin_or_super_wallet(get_current_user_wallet()));

CREATE POLICY "Admins can update exchange templates"
  ON public.item_exchange_templates FOR UPDATE
  TO public USING (is_admin_or_super_wallet(get_current_user_wallet()));

CREATE POLICY "Admins can delete exchange templates"
  ON public.item_exchange_templates FOR DELETE
  TO public USING (is_admin_or_super_wallet(get_current_user_wallet()));

-- 2. Table: item_exchange_settings
CREATE TABLE public.item_exchange_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  min_quests_per_day INTEGER NOT NULL DEFAULT 3,
  max_quests_per_day INTEGER NOT NULL DEFAULT 5,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by_wallet TEXT
);

ALTER TABLE public.item_exchange_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view exchange settings"
  ON public.item_exchange_settings FOR SELECT
  TO public USING (true);

CREATE POLICY "Admins can update exchange settings"
  ON public.item_exchange_settings FOR UPDATE
  TO public USING (is_admin_or_super_wallet(get_current_user_wallet()));

-- Insert default settings row
INSERT INTO public.item_exchange_settings (min_quests_per_day, max_quests_per_day) VALUES (3, 5);

-- 3. Table: user_item_exchanges
CREATE TABLE public.user_item_exchanges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL,
  template_id UUID NOT NULL REFERENCES public.item_exchange_templates(id) ON DELETE CASCADE,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  is_claimed BOOLEAN NOT NULL DEFAULT false,
  assigned_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(wallet_address, template_id, assigned_date)
);

ALTER TABLE public.user_item_exchanges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own exchanges"
  ON public.user_item_exchanges FOR SELECT
  TO public USING (wallet_address = get_current_user_wallet());

CREATE POLICY "Service role full access on user_item_exchanges"
  ON public.user_item_exchanges FOR ALL
  TO public USING (current_setting('role', true) = 'service_role');

-- 4. RPC: get_user_item_exchanges
CREATE OR REPLACE FUNCTION public.get_user_item_exchanges(p_wallet_address TEXT)
RETURNS TABLE(
  exchange_id UUID,
  template_id UUID,
  title_ru TEXT,
  title_en TEXT,
  description_ru TEXT,
  description_en TEXT,
  icon TEXT,
  required_items JSONB,
  reward_items JSONB,
  reward_ell INTEGER,
  is_completed BOOLEAN,
  is_claimed BOOLEAN,
  assigned_date DATE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
  v_target INTEGER;
  v_min INTEGER;
  v_max INTEGER;
BEGIN
  -- Check if user has exchanges for today
  SELECT count(*) INTO v_count
  FROM user_item_exchanges
  WHERE user_item_exchanges.wallet_address = p_wallet_address
    AND user_item_exchanges.assigned_date = CURRENT_DATE;

  -- If no exchanges yet, assign random ones
  IF v_count = 0 THEN
    SELECT s.min_quests_per_day, s.max_quests_per_day
    INTO v_min, v_max
    FROM item_exchange_settings s
    LIMIT 1;

    v_min := COALESCE(v_min, 3);
    v_max := COALESCE(v_max, 5);
    v_target := v_min + floor(random() * (v_max - v_min + 1))::integer;

    INSERT INTO user_item_exchanges (wallet_address, template_id, assigned_date)
    SELECT p_wallet_address, t.id, CURRENT_DATE
    FROM item_exchange_templates t
    WHERE t.is_active = true
    ORDER BY random() * t.weight DESC
    LIMIT v_target;
  END IF;

  -- Return today's exchanges with template data
  RETURN QUERY
  SELECT
    ue.id AS exchange_id,
    ue.template_id,
    t.title_ru,
    t.title_en,
    t.description_ru,
    t.description_en,
    t.icon,
    t.required_items,
    t.reward_items,
    t.reward_ell,
    ue.is_completed,
    ue.is_claimed,
    ue.assigned_date
  FROM user_item_exchanges ue
  JOIN item_exchange_templates t ON t.id = ue.template_id
  WHERE ue.wallet_address = p_wallet_address
    AND ue.assigned_date = CURRENT_DATE
  ORDER BY t.title_ru;
END;
$$;

-- 5. RPC: submit_item_exchange
CREATE OR REPLACE FUNCTION public.submit_item_exchange(p_wallet_address TEXT, p_exchange_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_template_id UUID;
  v_required JSONB;
  v_rewards JSONB;
  v_reward_ell INTEGER;
  v_item JSONB;
  v_owned_count INTEGER;
  v_needed INTEGER;
  v_tmpl_id INTEGER;
  v_delete_ids UUID[];
  v_temp_ids UUID[];
  v_user_id UUID;
  v_current_balance INTEGER;
BEGIN
  -- Get exchange info
  SELECT ue.template_id INTO v_template_id
  FROM user_item_exchanges ue
  WHERE ue.id = p_exchange_id
    AND ue.wallet_address = p_wallet_address
    AND ue.assigned_date = CURRENT_DATE
    AND ue.is_completed = false;

  IF v_template_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Exchange not found or already completed');
  END IF;

  -- Get template
  SELECT t.required_items, t.reward_items, t.reward_ell
  INTO v_required, v_rewards, v_reward_ell
  FROM item_exchange_templates t
  WHERE t.id = v_template_id;

  -- Get user_id
  SELECT p.user_id INTO v_user_id
  FROM profiles p WHERE p.wallet_address = p_wallet_address LIMIT 1;

  -- Check and collect items to delete
  v_delete_ids := ARRAY[]::UUID[];
  FOR v_item IN SELECT * FROM jsonb_array_elements(v_required) LOOP
    v_tmpl_id := (v_item->>'template_id')::INTEGER;
    v_needed := (v_item->>'quantity')::INTEGER;

    SELECT array_agg(ii.id) INTO v_temp_ids
    FROM (
      SELECT ii2.id FROM item_instances ii2
      WHERE ii2.wallet_address = p_wallet_address
        AND ii2.template_id = v_tmpl_id
      LIMIT v_needed
    ) ii;

    IF v_temp_ids IS NULL OR array_length(v_temp_ids, 1) < v_needed THEN
      RETURN jsonb_build_object('success', false, 'error', 'Not enough items: template_id=' || v_tmpl_id);
    END IF;

    v_delete_ids := v_delete_ids || v_temp_ids;
  END LOOP;

  -- Delete required items
  DELETE FROM item_instances WHERE id = ANY(v_delete_ids);

  -- Give reward items
  FOR v_item IN SELECT * FROM jsonb_array_elements(v_rewards) LOOP
    v_tmpl_id := (v_item->>'template_id')::INTEGER;
    v_needed := (v_item->>'quantity')::INTEGER;

    FOR i IN 1..v_needed LOOP
      INSERT INTO item_instances (wallet_address, user_id, template_id, item_id, name, type)
      SELECT p_wallet_address, v_user_id, it.id, it.item_id, it.name, it.type
      FROM item_templates it WHERE it.id = v_tmpl_id;
    END LOOP;
  END LOOP;

  -- Give ELL reward
  IF v_reward_ell > 0 THEN
    UPDATE game_data SET balance = balance + v_reward_ell, updated_at = now()
    WHERE wallet_address = p_wallet_address;

    SELECT balance INTO v_current_balance FROM game_data WHERE wallet_address = p_wallet_address;
  END IF;

  -- Mark completed
  UPDATE user_item_exchanges
  SET is_completed = true, is_claimed = true, updated_at = now()
  WHERE id = p_exchange_id;

  RETURN jsonb_build_object(
    'success', true,
    'reward_ell', v_reward_ell,
    'new_balance', COALESCE(v_current_balance, 0)
  );
END;
$$;
