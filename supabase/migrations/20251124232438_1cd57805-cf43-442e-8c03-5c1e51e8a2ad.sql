-- Drop the old INTEGER version of apply_battle_rewards to resolve function overloading conflict
DROP FUNCTION IF EXISTS public.apply_battle_rewards(
  TEXT,
  INTEGER,
  INTEGER,
  JSONB,
  JSONB,
  JSONB
);

-- Recreate the NUMERIC version (ensuring it's the only one)
CREATE OR REPLACE FUNCTION public.apply_battle_rewards(
  p_wallet_address TEXT,
  p_ell_reward NUMERIC DEFAULT 0,
  p_experience_reward NUMERIC DEFAULT 0,
  p_items JSONB DEFAULT '[]'::jsonb,
  p_card_kills JSONB DEFAULT '[]'::jsonb,
  p_card_health_updates JSONB DEFAULT '[]'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_current_balance NUMERIC;
  v_current_exp NUMERIC;
  v_current_level INTEGER;
  v_item JSONB;
  v_card_kill JSONB;
  v_card_update JSONB;
  v_card_instance_id TEXT;
  v_results JSONB;
BEGIN
  -- Получаем user_id и текущие значения баланса/опыта из game_data
  SELECT user_id, balance, account_experience, account_level
  INTO v_user_id, v_current_balance, v_current_exp, v_current_level
  FROM public.game_data
  WHERE wallet_address = p_wallet_address
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found: %', p_wallet_address;
  END IF;

  -- 1. Обновляем баланс ELL и опыт
  IF p_ell_reward > 0 OR p_experience_reward > 0 THEN
    UPDATE public.game_data
    SET 
      balance = balance + p_ell_reward,
      account_experience = account_experience + p_experience_reward,
      updated_at = NOW()
    WHERE wallet_address = p_wallet_address;
  END IF;

  -- 2. Добавляем предметы в item_instances
  IF jsonb_array_length(p_items) > 0 THEN
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
      INSERT INTO public.item_instances (
        wallet_address,
        user_id,
        template_id,
        item_id,
        name,
        type
      )
      VALUES (
        p_wallet_address,
        v_user_id,
        (v_item->>'template_id')::integer,
        v_item->>'item_id',
        v_item->>'name',
        v_item->>'type'
      );
    END LOOP;
  END IF;

  -- 3. Обновляем убийства карточек (monster_kills)
  IF jsonb_array_length(p_card_kills) > 0 THEN
    FOR v_card_kill IN SELECT * FROM jsonb_array_elements(p_card_kills)
    LOOP
      UPDATE public.card_instances
      SET 
        monster_kills = monster_kills + (v_card_kill->>'kills')::integer,
        updated_at = NOW()
      WHERE wallet_address = p_wallet_address
        AND card_template_id = v_card_kill->>'card_template_id';
    END LOOP;
  END IF;

  -- 4. Обновляем здоровье и броню карточек по card_instance_id
  IF jsonb_array_length(p_card_health_updates) > 0 THEN
    FOR v_card_update IN SELECT * FROM jsonb_array_elements(p_card_health_updates)
    LOOP
      v_card_instance_id := v_card_update->>'card_instance_id';
      
      UPDATE public.card_instances
      SET 
        current_health = GREATEST(0, (v_card_update->>'current_health')::integer),
        current_defense = GREATEST(0, (v_card_update->>'current_defense')::integer),
        updated_at = NOW()
      WHERE id = v_card_instance_id;
    END LOOP;
  END IF;

  -- Формируем результат
  v_results := jsonb_build_object(
    'ell_added', p_ell_reward,
    'experience_added', p_experience_reward,
    'items_added', jsonb_array_length(p_items),
    'cards_updated', jsonb_array_length(p_card_health_updates),
    'kills_updated', jsonb_array_length(p_card_kills)
  );

  RETURN v_results;
END;
$$;