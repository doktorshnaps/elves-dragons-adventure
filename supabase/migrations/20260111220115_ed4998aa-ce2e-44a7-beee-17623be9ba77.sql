-- Create table for daily/weekly quest templates
CREATE TABLE public.daily_quest_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quest_type TEXT NOT NULL CHECK (quest_type IN ('daily', 'weekly')),
  quest_key TEXT NOT NULL UNIQUE,
  title_ru TEXT NOT NULL,
  title_en TEXT NOT NULL,
  description_ru TEXT NOT NULL,
  description_en TEXT NOT NULL,
  target_value INTEGER NOT NULL DEFAULT 1,
  reward_type TEXT NOT NULL DEFAULT 'ell' CHECK (reward_type IN ('ell', 'mgt', 'gold')),
  reward_amount INTEGER NOT NULL DEFAULT 10,
  icon TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for user daily/weekly quest progress
CREATE TABLE public.user_daily_quest_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  quest_template_id UUID NOT NULL REFERENCES public.daily_quest_templates(id) ON DELETE CASCADE,
  current_value INTEGER NOT NULL DEFAULT 0,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  is_claimed BOOLEAN NOT NULL DEFAULT false,
  reset_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(wallet_address, quest_template_id, reset_at)
);

-- Enable RLS
ALTER TABLE public.daily_quest_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_daily_quest_progress ENABLE ROW LEVEL SECURITY;

-- Policies for quest templates (everyone can read active ones)
CREATE POLICY "Anyone can view active quest templates"
ON public.daily_quest_templates
FOR SELECT
USING (is_active = true);

-- Policies for user progress
CREATE POLICY "Users can view own quest progress"
ON public.user_daily_quest_progress
FOR SELECT
USING (wallet_address = public.get_current_user_wallet());

CREATE POLICY "Users can insert own quest progress"
ON public.user_daily_quest_progress
FOR INSERT
WITH CHECK (wallet_address = public.get_current_user_wallet());

CREATE POLICY "Users can update own quest progress"
ON public.user_daily_quest_progress
FOR UPDATE
USING (wallet_address = public.get_current_user_wallet());

-- Insert default daily quests
INSERT INTO public.daily_quest_templates (quest_type, quest_key, title_ru, title_en, description_ru, description_en, target_value, reward_type, reward_amount, icon, display_order) VALUES
('daily', 'kill_monsters_5', 'Охотник', 'Hunter', 'Убей 5 монстров в подземелье', 'Kill 5 monsters in dungeon', 5, 'ell', 25, '⚔️', 1),
('daily', 'open_chest_1', 'Искатель сокровищ', 'Treasure Seeker', 'Открой 1 сундук Эллеонор', 'Open 1 Elleonor chest', 1, 'mgt', 5, '🎁', 2),
('daily', 'complete_dungeon_1', 'Исследователь', 'Explorer', 'Пройди 1 уровень подземелья', 'Complete 1 dungeon level', 1, 'ell', 50, '🏰', 3),
('weekly', 'kill_monsters_100', 'Истребитель', 'Exterminator', 'Убей 100 монстров за неделю', 'Kill 100 monsters this week', 100, 'ell', 500, '💀', 1);

-- Function to get or create user quest progress for current period
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
  template RECORD;
BEGIN
  -- Calculate reset times (daily resets at midnight UTC, weekly on Monday)
  daily_reset := date_trunc('day', now() AT TIME ZONE 'UTC');
  weekly_reset := date_trunc('week', now() AT TIME ZONE 'UTC');

  -- Create progress records for missing quests
  FOR template IN 
    SELECT t.id, t.quest_type 
    FROM daily_quest_templates t 
    WHERE t.is_active = true
  LOOP
    INSERT INTO user_daily_quest_progress (
      wallet_address, 
      quest_template_id, 
      reset_at
    )
    VALUES (
      p_wallet_address,
      template.id,
      CASE WHEN template.quest_type = 'daily' THEN daily_reset ELSE weekly_reset END
    )
    ON CONFLICT (wallet_address, quest_template_id, reset_at) DO NOTHING;
  END LOOP;

  -- Return quests with progress
  RETURN QUERY
  SELECT 
    p.id,
    t.id as quest_template_id,
    t.quest_type,
    t.quest_key,
    t.title_ru,
    t.title_en,
    t.description_ru,
    t.description_en,
    t.target_value,
    p.current_value,
    t.reward_type,
    t.reward_amount,
    t.icon,
    p.is_completed,
    p.is_claimed,
    p.reset_at
  FROM daily_quest_templates t
  JOIN user_daily_quest_progress p ON p.quest_template_id = t.id
  WHERE t.is_active = true
    AND p.wallet_address = p_wallet_address
    AND (
      (t.quest_type = 'daily' AND p.reset_at = daily_reset)
      OR (t.quest_type = 'weekly' AND p.reset_at = weekly_reset)
    )
  ORDER BY t.quest_type, t.display_order;
END;
$$;

-- Function to update quest progress
CREATE OR REPLACE FUNCTION public.update_daily_quest_progress(
  p_wallet_address TEXT,
  p_quest_key TEXT,
  p_increment INTEGER DEFAULT 1
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_template_id UUID;
  v_quest_type TEXT;
  v_target INTEGER;
  v_reset_at TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get template info
  SELECT id, quest_type, target_value 
  INTO v_template_id, v_quest_type, v_target
  FROM daily_quest_templates 
  WHERE quest_key = p_quest_key AND is_active = true;

  IF v_template_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Calculate reset time
  IF v_quest_type = 'daily' THEN
    v_reset_at := date_trunc('day', now() AT TIME ZONE 'UTC');
  ELSE
    v_reset_at := date_trunc('week', now() AT TIME ZONE 'UTC');
  END IF;

  -- Update or insert progress
  INSERT INTO user_daily_quest_progress (wallet_address, quest_template_id, current_value, reset_at)
  VALUES (p_wallet_address, v_template_id, p_increment, v_reset_at)
  ON CONFLICT (wallet_address, quest_template_id, reset_at) 
  DO UPDATE SET 
    current_value = LEAST(user_daily_quest_progress.current_value + p_increment, v_target),
    is_completed = (user_daily_quest_progress.current_value + p_increment) >= v_target,
    updated_at = now();

  RETURN TRUE;
END;
$$;

-- Function to claim daily quest reward
CREATE OR REPLACE FUNCTION public.claim_daily_quest_reward(
  p_wallet_address TEXT,
  p_progress_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_quest RECORD;
  v_new_balance NUMERIC;
BEGIN
  -- Get quest progress and template info
  SELECT p.*, t.reward_type, t.reward_amount, t.quest_type
  INTO v_quest
  FROM user_daily_quest_progress p
  JOIN daily_quest_templates t ON t.id = p.quest_template_id
  WHERE p.id = p_progress_id
    AND p.wallet_address = p_wallet_address
    AND p.is_completed = true
    AND p.is_claimed = false;

  IF v_quest IS NULL THEN
    RAISE EXCEPTION 'Quest not found, not completed, or already claimed';
  END IF;

  -- Mark as claimed
  UPDATE user_daily_quest_progress
  SET is_claimed = true, updated_at = now()
  WHERE id = p_progress_id;

  -- Add reward based on type
  IF v_quest.reward_type = 'ell' THEN
    UPDATE game_data 
    SET balance = balance + v_quest.reward_amount, updated_at = now()
    WHERE wallet_address = p_wallet_address
    RETURNING balance INTO v_new_balance;
  ELSIF v_quest.reward_type = 'mgt' THEN
    UPDATE game_data 
    SET mgt_balance = COALESCE(mgt_balance, 0) + v_quest.reward_amount, updated_at = now()
    WHERE wallet_address = p_wallet_address
    RETURNING mgt_balance INTO v_new_balance;
  ELSIF v_quest.reward_type = 'gold' THEN
    UPDATE game_data 
    SET gold = gold + v_quest.reward_amount, updated_at = now()
    WHERE wallet_address = p_wallet_address
    RETURNING gold INTO v_new_balance;
  END IF;

  RETURN json_build_object(
    'success', true,
    'reward_type', v_quest.reward_type,
    'reward_amount', v_quest.reward_amount,
    'new_balance', v_new_balance
  );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_user_daily_quests(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_daily_quest_progress(TEXT, TEXT, INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_daily_quest_reward(TEXT, UUID) TO anon, authenticated;