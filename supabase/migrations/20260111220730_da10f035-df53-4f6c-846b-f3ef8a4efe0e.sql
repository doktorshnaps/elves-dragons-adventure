-- Fix ambiguous column reference in ON CONFLICT by using constraint name
CREATE OR REPLACE FUNCTION public.get_user_daily_quests(p_wallet_address TEXT)
RETURNS TABLE (
  id UUID,
  quest_template_id UUID,
  quest_type TEXT,
  quest_key TEXT,
  title_ru TEXT,
  title_en TEXT,
  description_ru TEXT,
  description_en TEXT,
  target_value INTEGER,
  current_value INTEGER,
  reward_type TEXT,
  reward_amount INTEGER,
  icon TEXT,
  is_completed BOOLEAN,
  is_claimed BOOLEAN,
  reset_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  daily_reset TIMESTAMP WITH TIME ZONE;
  weekly_reset TIMESTAMP WITH TIME ZONE;
  v_template RECORD;
BEGIN
  daily_reset := date_trunc('day', now() AT TIME ZONE 'UTC');
  weekly_reset := date_trunc('week', now() AT TIME ZONE 'UTC');

  FOR v_template IN 
    SELECT dqt.id AS template_id, dqt.quest_type AS template_quest_type
    FROM daily_quest_templates dqt
    WHERE dqt.is_active = true
  LOOP
    INSERT INTO user_daily_quest_progress (wallet_address, quest_template_id, reset_at)
    VALUES (
      p_wallet_address,
      v_template.template_id,
      CASE WHEN v_template.template_quest_type = 'daily' THEN daily_reset ELSE weekly_reset END
    )
    ON CONFLICT ON CONSTRAINT user_daily_quest_progress_wallet_address_quest_template_id__key
    DO NOTHING;
  END LOOP;

  RETURN QUERY
  SELECT 
    udqp.id,
    dqt.id as quest_template_id,
    dqt.quest_type,
    dqt.quest_key,
    dqt.title_ru,
    dqt.title_en,
    dqt.description_ru,
    dqt.description_en,
    dqt.target_value,
    udqp.current_value,
    dqt.reward_type,
    dqt.reward_amount,
    dqt.icon,
    udqp.is_completed,
    udqp.is_claimed,
    udqp.reset_at
  FROM daily_quest_templates dqt
  JOIN user_daily_quest_progress udqp ON udqp.quest_template_id = dqt.id
  WHERE dqt.is_active = true
    AND udqp.wallet_address = p_wallet_address
    AND (
      (dqt.quest_type = 'daily' AND udqp.reset_at = daily_reset)
      OR (dqt.quest_type = 'weekly' AND udqp.reset_at = weekly_reset)
    )
  ORDER BY dqt.quest_type, dqt.display_order;
END;
$$;