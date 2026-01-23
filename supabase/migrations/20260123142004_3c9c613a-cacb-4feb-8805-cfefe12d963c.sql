-- ========================================
-- ФАЗА 1: PvP Инфраструктура базы данных
-- ========================================

-- 1. Таблица настроек PvP (для админов)
CREATE TABLE public.pvp_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text NOT NULL UNIQUE,
  setting_value jsonb NOT NULL DEFAULT '{}'::jsonb,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by_wallet_address text NOT NULL
);

-- 2. Таблица сезонов
CREATE TABLE public.pvp_seasons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  season_number integer NOT NULL UNIQUE,
  name text NOT NULL,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  is_active boolean NOT NULL DEFAULT false,
  rewards_config jsonb NOT NULL DEFAULT '{
    "bronze": {"min_elo": 0, "max_elo": 1199, "icon": "🥉", "ell_reward": 500},
    "silver": {"min_elo": 1200, "max_elo": 1399, "icon": "🥈", "ell_reward": 1500},
    "gold": {"min_elo": 1400, "max_elo": 1599, "icon": "🥇", "ell_reward": 3000},
    "platinum": {"min_elo": 1600, "max_elo": 1799, "icon": "💎", "ell_reward": 5000, "bonus_card": true},
    "diamond": {"min_elo": 1800, "max_elo": 1999, "icon": "💠", "ell_reward": 10000, "bonus_card": "rare"},
    "master": {"min_elo": 2000, "max_elo": 2199, "icon": "⭐", "ell_reward": 20000, "bonus_card": "epic"},
    "legend": {"min_elo": 2200, "max_elo": 99999, "icon": "👑", "ell_reward": 50000, "bonus_card": "legendary", "title": true}
  }'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Таблица рейтингов игроков (pvp_ratings)
CREATE TABLE public.pvp_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address text NOT NULL,
  season_id uuid REFERENCES public.pvp_seasons(id) ON DELETE CASCADE,
  elo integer NOT NULL DEFAULT 1000,
  tier text NOT NULL DEFAULT 'bronze',
  wins integer NOT NULL DEFAULT 0,
  losses integer NOT NULL DEFAULT 0,
  win_streak integer NOT NULL DEFAULT 0,
  best_win_streak integer NOT NULL DEFAULT 0,
  matches_played integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (wallet_address, season_id)
);

-- 4. Таблица PvP колод (по тирам редкости)
CREATE TABLE public.pvp_decks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address text NOT NULL,
  rarity_tier integer NOT NULL CHECK (rarity_tier >= 1 AND rarity_tier <= 8),
  deck_name text NOT NULL DEFAULT 'Колода',
  hero_1_instance_id uuid REFERENCES public.card_instances(id) ON DELETE SET NULL,
  hero_2_instance_id uuid REFERENCES public.card_instances(id) ON DELETE SET NULL,
  dragon_1_instance_id uuid REFERENCES public.card_instances(id) ON DELETE SET NULL,
  dragon_2_instance_id uuid REFERENCES public.card_instances(id) ON DELETE SET NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (wallet_address, rarity_tier)
);

-- 5. Таблица матчей (pvp_matches)
CREATE TABLE public.pvp_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id uuid REFERENCES public.pvp_seasons(id) ON DELETE SET NULL,
  match_type text NOT NULL DEFAULT 'ranked' CHECK (match_type IN ('ranked', 'casual', 'tournament')),
  rarity_tier integer NOT NULL CHECK (rarity_tier >= 1 AND rarity_tier <= 8),
  
  -- Игрок 1
  player1_wallet text NOT NULL,
  player1_elo_before integer NOT NULL,
  player1_team_snapshot jsonb NOT NULL,
  
  -- Игрок 2
  player2_wallet text NOT NULL,
  player2_elo_before integer NOT NULL,
  player2_team_snapshot jsonb NOT NULL,
  
  -- Текущее состояние боя
  battle_state jsonb NOT NULL DEFAULT '{
    "current_turn": "player1",
    "turn_number": 1,
    "player1_pairs": [],
    "player2_pairs": [],
    "last_action": null
  }'::jsonb,
  
  -- Кто сейчас ходит
  current_turn_wallet text,
  turn_started_at timestamptz,
  turn_timeout_seconds integer NOT NULL DEFAULT 3600,
  
  -- Результат
  winner_wallet text,
  loser_wallet text,
  elo_change integer,
  battle_log jsonb DEFAULT '[]'::jsonb,
  
  -- Статусы
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'timeout', 'cancelled')),
  started_at timestamptz,
  finished_at timestamptz,
  
  -- Стоимость входа и награды
  entry_fee integer NOT NULL DEFAULT 100,
  winner_reward integer,
  
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 6. Таблица очереди матчмейкинга (pvp_queue)
CREATE TABLE public.pvp_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address text NOT NULL,
  match_type text NOT NULL DEFAULT 'ranked' CHECK (match_type IN ('ranked', 'casual', 'tournament')),
  rarity_tier integer NOT NULL CHECK (rarity_tier >= 1 AND rarity_tier <= 8),
  current_elo integer NOT NULL DEFAULT 1000,
  team_snapshot jsonb NOT NULL,
  joined_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '5 minutes'),
  status text NOT NULL DEFAULT 'searching' CHECK (status IN ('searching', 'matched', 'expired')),
  matched_with_wallet text,
  match_id uuid REFERENCES public.pvp_matches(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 7. История ходов (для асинхронного режима)
CREATE TABLE public.pvp_moves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES public.pvp_matches(id) ON DELETE CASCADE,
  turn_number integer NOT NULL,
  player_wallet text NOT NULL,
  action_type text NOT NULL CHECK (action_type IN ('attack', 'ability', 'timeout', 'surrender')),
  attacker_pair_index integer,
  target_pair_index integer,
  ability_id text,
  dice_roll_attacker integer,
  dice_roll_defender integer,
  damage_dealt integer DEFAULT 0,
  is_critical boolean DEFAULT false,
  is_blocked boolean DEFAULT false,
  result_state jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ========================================
-- ИНДЕКСЫ ДЛЯ ПРОИЗВОДИТЕЛЬНОСТИ
-- ========================================

CREATE INDEX idx_pvp_ratings_wallet ON public.pvp_ratings(wallet_address);
CREATE INDEX idx_pvp_ratings_season ON public.pvp_ratings(season_id);
CREATE INDEX idx_pvp_ratings_elo ON public.pvp_ratings(elo DESC);
CREATE INDEX idx_pvp_ratings_tier ON public.pvp_ratings(tier);

CREATE INDEX idx_pvp_decks_wallet ON public.pvp_decks(wallet_address);
CREATE INDEX idx_pvp_decks_tier ON public.pvp_decks(rarity_tier);

CREATE INDEX idx_pvp_matches_status ON public.pvp_matches(status);
CREATE INDEX idx_pvp_matches_player1 ON public.pvp_matches(player1_wallet);
CREATE INDEX idx_pvp_matches_player2 ON public.pvp_matches(player2_wallet);
CREATE INDEX idx_pvp_matches_season ON public.pvp_matches(season_id);
CREATE INDEX idx_pvp_matches_current_turn ON public.pvp_matches(current_turn_wallet) WHERE status = 'active';

CREATE INDEX idx_pvp_queue_status ON public.pvp_queue(status);
CREATE INDEX idx_pvp_queue_tier ON public.pvp_queue(rarity_tier);
CREATE INDEX idx_pvp_queue_searching ON public.pvp_queue(match_type, rarity_tier, current_elo) WHERE status = 'searching';

CREATE INDEX idx_pvp_moves_match ON public.pvp_moves(match_id);
CREATE INDEX idx_pvp_moves_turn ON public.pvp_moves(match_id, turn_number);

-- ========================================
-- RLS ПОЛИТИКИ
-- ========================================

ALTER TABLE public.pvp_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pvp_seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pvp_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pvp_decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pvp_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pvp_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pvp_moves ENABLE ROW LEVEL SECURITY;

-- pvp_settings: только админы
CREATE POLICY "Anyone can view pvp settings" ON public.pvp_settings FOR SELECT USING (true);
CREATE POLICY "Only admins can modify pvp settings" ON public.pvp_settings FOR ALL USING (is_admin_or_super_wallet(get_current_user_wallet()));

-- pvp_seasons: все могут читать, только админы изменяют
CREATE POLICY "Anyone can view pvp seasons" ON public.pvp_seasons FOR SELECT USING (true);
CREATE POLICY "Only admins can modify pvp seasons" ON public.pvp_seasons FOR ALL USING (is_admin_or_super_wallet(get_current_user_wallet()));

-- pvp_ratings: пользователи видят все рейтинги (для лидерборда), модифицируют только свои
CREATE POLICY "Anyone can view pvp ratings" ON public.pvp_ratings FOR SELECT USING (true);
CREATE POLICY "Users can insert own rating" ON public.pvp_ratings FOR INSERT WITH CHECK (wallet_address = get_current_user_wallet());
CREATE POLICY "Service role can update ratings" ON public.pvp_ratings FOR UPDATE USING (current_setting('role', true) = 'service_role');

-- pvp_decks: пользователи управляют только своими колодами
CREATE POLICY "Users can view own pvp decks" ON public.pvp_decks FOR SELECT USING (wallet_address = get_current_user_wallet());
CREATE POLICY "Users can manage own pvp decks" ON public.pvp_decks FOR ALL USING (wallet_address = get_current_user_wallet());

-- pvp_matches: участники матча могут видеть и обновлять
CREATE POLICY "Participants can view their matches" ON public.pvp_matches FOR SELECT USING (
  player1_wallet = get_current_user_wallet() OR player2_wallet = get_current_user_wallet()
);
CREATE POLICY "Service role can manage matches" ON public.pvp_matches FOR ALL USING (current_setting('role', true) = 'service_role');

-- pvp_queue: пользователи управляют только своей записью в очереди
CREATE POLICY "Users can view own queue entry" ON public.pvp_queue FOR SELECT USING (wallet_address = get_current_user_wallet());
CREATE POLICY "Users can join queue" ON public.pvp_queue FOR INSERT WITH CHECK (wallet_address = get_current_user_wallet());
CREATE POLICY "Users can leave queue" ON public.pvp_queue FOR DELETE USING (wallet_address = get_current_user_wallet());
CREATE POLICY "Service role can manage queue" ON public.pvp_queue FOR ALL USING (current_setting('role', true) = 'service_role');

-- pvp_moves: участники матча могут видеть ходы
CREATE POLICY "Match participants can view moves" ON public.pvp_moves FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.pvp_matches m 
    WHERE m.id = pvp_moves.match_id 
    AND (m.player1_wallet = get_current_user_wallet() OR m.player2_wallet = get_current_user_wallet())
  )
);
CREATE POLICY "Service role can manage moves" ON public.pvp_moves FOR ALL USING (current_setting('role', true) = 'service_role');

-- ========================================
-- ТРИГГЕРЫ ДЛЯ updated_at
-- ========================================

CREATE TRIGGER update_pvp_settings_updated_at BEFORE UPDATE ON public.pvp_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pvp_seasons_updated_at BEFORE UPDATE ON public.pvp_seasons
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pvp_ratings_updated_at BEFORE UPDATE ON public.pvp_ratings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pvp_decks_updated_at BEFORE UPDATE ON public.pvp_decks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pvp_matches_updated_at BEFORE UPDATE ON public.pvp_matches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ========================================
-- НАЧАЛЬНЫЕ ДАННЫЕ
-- ========================================

-- Настройки по умолчанию
INSERT INTO public.pvp_settings (setting_key, setting_value, description, created_by_wallet_address) VALUES
  ('match_entry_fee', '{"ranked": 100}'::jsonb, 'Стоимость входа в матч по типам', 'system'),
  ('elo_change', '{"win": 24, "loss": -24}'::jsonb, 'Изменение рейтинга за победу/поражение', 'system'),
  ('turn_timeout', '{"default": 3600, "min": 300, "max": 86400}'::jsonb, 'Таймаут хода в секундах (настраиваемый)', 'system'),
  ('matchmaking_elo_range', '{"initial": 100, "expand_per_minute": 50, "max": 500}'::jsonb, 'Диапазон поиска по Elo', 'system');

-- Первый сезон
INSERT INTO public.pvp_seasons (season_number, name, starts_at, ends_at, is_active) VALUES
  (1, 'Сезон 1: Начало', now(), now() + interval '90 days', true);