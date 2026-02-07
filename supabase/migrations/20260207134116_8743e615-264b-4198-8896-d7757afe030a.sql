
-- ============================================================
-- CLAN SYSTEM - Phase 1: Foundation
-- ============================================================

-- 1. Create clans table
CREATE TABLE public.clans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  emblem text DEFAULT 'shield',
  leader_wallet text NOT NULL,
  level integer DEFAULT 1,
  experience integer DEFAULT 0,
  treasury_ell integer DEFAULT 0,
  max_members integer DEFAULT 20,
  join_policy text DEFAULT 'approval',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT clans_name_length CHECK (char_length(name) >= 3 AND char_length(name) <= 20),
  CONSTRAINT clans_description_length CHECK (description IS NULL OR char_length(description) <= 200),
  CONSTRAINT clans_join_policy_check CHECK (join_policy IN ('open', 'approval', 'invite_only'))
);

-- 2. Create clan_members table
CREATE TABLE public.clan_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clan_id uuid NOT NULL REFERENCES public.clans(id) ON DELETE CASCADE,
  wallet_address text NOT NULL,
  role text NOT NULL DEFAULT 'member',
  joined_at timestamptz DEFAULT now(),
  contributed_ell integer DEFAULT 0,
  CONSTRAINT clan_members_unique UNIQUE (clan_id, wallet_address),
  CONSTRAINT clan_members_wallet_unique UNIQUE (wallet_address),
  CONSTRAINT clan_members_role_check CHECK (role IN ('leader', 'deputy', 'officer', 'member'))
);

-- 3. Create clan_join_requests table
CREATE TABLE public.clan_join_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clan_id uuid NOT NULL REFERENCES public.clans(id) ON DELETE CASCADE,
  wallet_address text NOT NULL,
  status text DEFAULT 'pending',
  message text,
  created_at timestamptz DEFAULT now(),
  reviewed_by text,
  reviewed_at timestamptz,
  CONSTRAINT clan_requests_status_check CHECK (status IN ('pending', 'accepted', 'rejected'))
);

-- Indexes
CREATE INDEX idx_clan_members_wallet ON public.clan_members(wallet_address);
CREATE INDEX idx_clan_members_clan ON public.clan_members(clan_id);
CREATE INDEX idx_clan_requests_clan_status ON public.clan_join_requests(clan_id, status);
CREATE INDEX idx_clan_requests_wallet ON public.clan_join_requests(wallet_address);
CREATE INDEX idx_clans_leader ON public.clans(leader_wallet);

-- ============================================================
-- RLS Policies
-- ============================================================

ALTER TABLE public.clans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clan_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clan_join_requests ENABLE ROW LEVEL SECURITY;

-- Clans: everyone authenticated can read (for leaderboard/search)
CREATE POLICY "Anyone can view clans" ON public.clans
  FOR SELECT TO authenticated USING (true);

-- Clan members: everyone authenticated can read
CREATE POLICY "Anyone can view clan members" ON public.clan_members
  FOR SELECT TO authenticated USING (true);

-- Clan join requests: members of clan can see requests for their clan, users can see own requests
CREATE POLICY "Members can view clan requests" ON public.clan_join_requests
  FOR SELECT TO authenticated
  USING (
    wallet_address IN (SELECT wallet_address FROM public.profiles WHERE user_id = auth.uid())
    OR
    clan_id IN (
      SELECT cm.clan_id FROM public.clan_members cm
      JOIN public.profiles p ON p.wallet_address = cm.wallet_address
      WHERE p.user_id = auth.uid()
    )
  );

-- All mutations go through RPC (SECURITY DEFINER), so no INSERT/UPDATE/DELETE policies needed for direct access
-- But we add restrictive policies to prevent direct manipulation
CREATE POLICY "No direct insert on clans" ON public.clans FOR INSERT TO authenticated WITH CHECK (false);
CREATE POLICY "No direct update on clans" ON public.clans FOR UPDATE TO authenticated USING (false);
CREATE POLICY "No direct delete on clans" ON public.clans FOR DELETE TO authenticated USING (false);

CREATE POLICY "No direct insert on clan_members" ON public.clan_members FOR INSERT TO authenticated WITH CHECK (false);
CREATE POLICY "No direct update on clan_members" ON public.clan_members FOR UPDATE TO authenticated USING (false);
CREATE POLICY "No direct delete on clan_members" ON public.clan_members FOR DELETE TO authenticated USING (false);

CREATE POLICY "No direct insert on clan_requests" ON public.clan_join_requests FOR INSERT TO authenticated WITH CHECK (false);
CREATE POLICY "No direct update on clan_requests" ON public.clan_join_requests FOR UPDATE TO authenticated USING (false);
CREATE POLICY "No direct delete on clan_requests" ON public.clan_join_requests FOR DELETE TO authenticated USING (false);

-- ============================================================
-- RPC Functions (SECURITY DEFINER)
-- ============================================================

-- Create clan
CREATE OR REPLACE FUNCTION public.create_clan(
  p_wallet text,
  p_name text,
  p_description text DEFAULT NULL,
  p_join_policy text DEFAULT 'approval'
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_clan_id uuid;
  v_existing_clan uuid;
BEGIN
  -- Check if player already in a clan
  SELECT clan_id INTO v_existing_clan FROM clan_members WHERE wallet_address = p_wallet;
  IF v_existing_clan IS NOT NULL THEN
    RETURN json_build_object('success', false, 'error', 'Вы уже состоите в клане');
  END IF;

  -- Validate name length
  IF char_length(p_name) < 3 OR char_length(p_name) > 20 THEN
    RETURN json_build_object('success', false, 'error', 'Название клана должно быть от 3 до 20 символов');
  END IF;

  -- Check name uniqueness
  IF EXISTS (SELECT 1 FROM clans WHERE lower(name) = lower(p_name)) THEN
    RETURN json_build_object('success', false, 'error', 'Клан с таким названием уже существует');
  END IF;

  -- Create clan
  INSERT INTO clans (name, description, leader_wallet, join_policy)
  VALUES (p_name, p_description, p_wallet, COALESCE(p_join_policy, 'approval'))
  RETURNING id INTO v_clan_id;

  -- Add leader as member
  INSERT INTO clan_members (clan_id, wallet_address, role)
  VALUES (v_clan_id, p_wallet, 'leader');

  RETURN json_build_object('success', true, 'clan_id', v_clan_id);
END;
$$;

-- Join clan (request or auto-join for open clans)
CREATE OR REPLACE FUNCTION public.join_clan(
  p_wallet text,
  p_clan_id uuid,
  p_message text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing_clan uuid;
  v_join_policy text;
  v_member_count integer;
  v_max_members integer;
BEGIN
  -- Check if already in a clan
  SELECT clan_id INTO v_existing_clan FROM clan_members WHERE wallet_address = p_wallet;
  IF v_existing_clan IS NOT NULL THEN
    RETURN json_build_object('success', false, 'error', 'Вы уже состоите в клане');
  END IF;

  -- Get clan info
  SELECT join_policy, max_members INTO v_join_policy, v_max_members
  FROM clans WHERE id = p_clan_id;
  
  IF v_join_policy IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Клан не найден');
  END IF;

  -- Check member count
  SELECT count(*) INTO v_member_count FROM clan_members WHERE clan_id = p_clan_id;
  IF v_member_count >= v_max_members THEN
    RETURN json_build_object('success', false, 'error', 'Клан переполнен');
  END IF;

  -- Check if already has pending request
  IF EXISTS (SELECT 1 FROM clan_join_requests WHERE wallet_address = p_wallet AND clan_id = p_clan_id AND status = 'pending') THEN
    RETURN json_build_object('success', false, 'error', 'Вы уже подали заявку в этот клан');
  END IF;

  IF v_join_policy = 'invite_only' THEN
    RETURN json_build_object('success', false, 'error', 'Клан принимает только по приглашению');
  END IF;

  IF v_join_policy = 'open' THEN
    -- Auto-join
    INSERT INTO clan_members (clan_id, wallet_address, role)
    VALUES (p_clan_id, p_wallet, 'member');
    RETURN json_build_object('success', true, 'auto_joined', true);
  END IF;

  -- Create join request (approval policy)
  INSERT INTO clan_join_requests (clan_id, wallet_address, message)
  VALUES (p_clan_id, p_wallet, p_message);
  
  RETURN json_build_object('success', true, 'auto_joined', false);
END;
$$;

-- Review join request
CREATE OR REPLACE FUNCTION public.review_join_request(
  p_wallet text,
  p_request_id uuid,
  p_accept boolean
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request record;
  v_reviewer_role text;
  v_member_count integer;
  v_max_members integer;
BEGIN
  -- Get request
  SELECT * INTO v_request FROM clan_join_requests WHERE id = p_request_id AND status = 'pending';
  IF v_request IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Заявка не найдена или уже обработана');
  END IF;

  -- Check reviewer is officer+ in the clan
  SELECT role INTO v_reviewer_role FROM clan_members
  WHERE clan_id = v_request.clan_id AND wallet_address = p_wallet;
  
  IF v_reviewer_role IS NULL OR v_reviewer_role = 'member' THEN
    RETURN json_build_object('success', false, 'error', 'Нет прав для обработки заявок');
  END IF;

  IF p_accept THEN
    -- Check member limit
    SELECT count(*), (SELECT max_members FROM clans WHERE id = v_request.clan_id)
    INTO v_member_count, v_max_members
    FROM clan_members WHERE clan_id = v_request.clan_id;
    
    IF v_member_count >= v_max_members THEN
      RETURN json_build_object('success', false, 'error', 'Клан переполнен');
    END IF;

    -- Check if applicant already in another clan
    IF EXISTS (SELECT 1 FROM clan_members WHERE wallet_address = v_request.wallet_address) THEN
      UPDATE clan_join_requests SET status = 'rejected', reviewed_by = p_wallet, reviewed_at = now()
      WHERE id = p_request_id;
      RETURN json_build_object('success', false, 'error', 'Игрок уже состоит в другом клане');
    END IF;

    -- Add member
    INSERT INTO clan_members (clan_id, wallet_address, role)
    VALUES (v_request.clan_id, v_request.wallet_address, 'member');
    
    -- Update request
    UPDATE clan_join_requests SET status = 'accepted', reviewed_by = p_wallet, reviewed_at = now()
    WHERE id = p_request_id;
    
    -- Reject other pending requests from this wallet
    UPDATE clan_join_requests SET status = 'rejected', reviewed_by = 'system', reviewed_at = now()
    WHERE wallet_address = v_request.wallet_address AND status = 'pending' AND id != p_request_id;
  ELSE
    UPDATE clan_join_requests SET status = 'rejected', reviewed_by = p_wallet, reviewed_at = now()
    WHERE id = p_request_id;
  END IF;

  RETURN json_build_object('success', true);
END;
$$;

-- Leave clan
CREATE OR REPLACE FUNCTION public.leave_clan(p_wallet text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_member record;
BEGIN
  SELECT * INTO v_member FROM clan_members WHERE wallet_address = p_wallet;
  IF v_member IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Вы не состоите в клане');
  END IF;

  IF v_member.role = 'leader' THEN
    RETURN json_build_object('success', false, 'error', 'Глава не может покинуть клан. Передайте лидерство другому участнику');
  END IF;

  DELETE FROM clan_members WHERE wallet_address = p_wallet;
  RETURN json_build_object('success', true);
END;
$$;

-- Kick member
CREATE OR REPLACE FUNCTION public.kick_member(p_wallet text, p_target_wallet text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_kicker record;
  v_target record;
BEGIN
  SELECT * INTO v_kicker FROM clan_members WHERE wallet_address = p_wallet;
  SELECT * INTO v_target FROM clan_members WHERE wallet_address = p_target_wallet;

  IF v_kicker IS NULL OR v_target IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Участник не найден');
  END IF;

  IF v_kicker.clan_id != v_target.clan_id THEN
    RETURN json_build_object('success', false, 'error', 'Участник не в вашем клане');
  END IF;

  -- Permission check: leader can kick anyone except self, deputy can kick officer/member
  IF v_kicker.role = 'leader' AND p_wallet != p_target_wallet THEN
    DELETE FROM clan_members WHERE wallet_address = p_target_wallet;
    RETURN json_build_object('success', true);
  ELSIF v_kicker.role = 'deputy' AND v_target.role IN ('officer', 'member') THEN
    DELETE FROM clan_members WHERE wallet_address = p_target_wallet;
    RETURN json_build_object('success', true);
  ELSIF v_kicker.role = 'officer' AND v_target.role = 'member' THEN
    DELETE FROM clan_members WHERE wallet_address = p_target_wallet;
    RETURN json_build_object('success', true);
  END IF;

  RETURN json_build_object('success', false, 'error', 'Нет прав для исключения этого участника');
END;
$$;

-- Change member role
CREATE OR REPLACE FUNCTION public.change_member_role(
  p_wallet text,
  p_target_wallet text,
  p_new_role text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_changer record;
  v_target record;
  v_deputy_count integer;
BEGIN
  IF p_new_role NOT IN ('deputy', 'officer', 'member') THEN
    RETURN json_build_object('success', false, 'error', 'Недопустимая роль');
  END IF;

  SELECT * INTO v_changer FROM clan_members WHERE wallet_address = p_wallet;
  SELECT * INTO v_target FROM clan_members WHERE wallet_address = p_target_wallet;

  IF v_changer IS NULL OR v_target IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Участник не найден');
  END IF;

  IF v_changer.clan_id != v_target.clan_id THEN
    RETURN json_build_object('success', false, 'error', 'Участник не в вашем клане');
  END IF;

  -- Only leader can change roles
  IF v_changer.role != 'leader' THEN
    RETURN json_build_object('success', false, 'error', 'Только глава клана может менять роли');
  END IF;

  -- Cannot change own role
  IF p_wallet = p_target_wallet THEN
    RETURN json_build_object('success', false, 'error', 'Нельзя изменить свою роль');
  END IF;

  -- Check deputy limit (max 2)
  IF p_new_role = 'deputy' THEN
    SELECT count(*) INTO v_deputy_count FROM clan_members
    WHERE clan_id = v_changer.clan_id AND role = 'deputy';
    IF v_deputy_count >= 2 THEN
      RETURN json_build_object('success', false, 'error', 'Максимум 2 заместителя');
    END IF;
  END IF;

  UPDATE clan_members SET role = p_new_role WHERE wallet_address = p_target_wallet;
  RETURN json_build_object('success', true);
END;
$$;

-- Transfer leadership
CREATE OR REPLACE FUNCTION public.transfer_leadership(p_wallet text, p_target_wallet text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_leader record;
  v_target record;
BEGIN
  SELECT * INTO v_leader FROM clan_members WHERE wallet_address = p_wallet;
  SELECT * INTO v_target FROM clan_members WHERE wallet_address = p_target_wallet;

  IF v_leader IS NULL OR v_leader.role != 'leader' THEN
    RETURN json_build_object('success', false, 'error', 'Вы не являетесь главой клана');
  END IF;

  IF v_target IS NULL OR v_leader.clan_id != v_target.clan_id THEN
    RETURN json_build_object('success', false, 'error', 'Участник не найден в вашем клане');
  END IF;

  -- Transfer
  UPDATE clan_members SET role = 'member' WHERE wallet_address = p_wallet;
  UPDATE clan_members SET role = 'leader' WHERE wallet_address = p_target_wallet;
  UPDATE clans SET leader_wallet = p_target_wallet WHERE id = v_leader.clan_id;

  RETURN json_build_object('success', true);
END;
$$;

-- Disband clan (only leader)
CREATE OR REPLACE FUNCTION public.disband_clan(p_wallet text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_clan_id uuid;
BEGIN
  SELECT clan_id INTO v_clan_id FROM clan_members
  WHERE wallet_address = p_wallet AND role = 'leader';
  
  IF v_clan_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Вы не являетесь главой клана');
  END IF;

  -- Delete clan (cascade deletes members and requests)
  DELETE FROM clans WHERE id = v_clan_id;
  RETURN json_build_object('success', true);
END;
$$;

-- Get my clan info with members
CREATE OR REPLACE FUNCTION public.get_my_clan(p_wallet text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_clan_id uuid;
  v_clan record;
  v_members json;
  v_pending_count integer;
  v_my_role text;
BEGIN
  SELECT clan_id, role INTO v_clan_id, v_my_role FROM clan_members WHERE wallet_address = p_wallet;
  
  IF v_clan_id IS NULL THEN
    RETURN json_build_object('success', true, 'clan', null);
  END IF;

  SELECT * INTO v_clan FROM clans WHERE id = v_clan_id;

  SELECT json_agg(row_to_json(m)) INTO v_members
  FROM (
    SELECT cm.wallet_address, cm.role, cm.joined_at, cm.contributed_ell,
           p.display_name,
           COALESCE(
             (SELECT pr.elo FROM pvp_ratings pr WHERE pr.wallet_address = cm.wallet_address ORDER BY pr.elo DESC LIMIT 1),
             1000
           ) as elo
    FROM clan_members cm
    LEFT JOIN profiles p ON p.wallet_address = cm.wallet_address
    WHERE cm.clan_id = v_clan_id
    ORDER BY 
      CASE cm.role 
        WHEN 'leader' THEN 1 
        WHEN 'deputy' THEN 2 
        WHEN 'officer' THEN 3 
        ELSE 4 
      END,
      cm.joined_at
  ) m;

  -- Count pending requests (only for officer+)
  IF v_my_role IN ('leader', 'deputy', 'officer') THEN
    SELECT count(*) INTO v_pending_count FROM clan_join_requests
    WHERE clan_id = v_clan_id AND status = 'pending';
  ELSE
    v_pending_count := 0;
  END IF;

  RETURN json_build_object(
    'success', true,
    'clan', json_build_object(
      'id', v_clan.id,
      'name', v_clan.name,
      'description', v_clan.description,
      'emblem', v_clan.emblem,
      'level', v_clan.level,
      'experience', v_clan.experience,
      'treasury_ell', v_clan.treasury_ell,
      'max_members', v_clan.max_members,
      'join_policy', v_clan.join_policy,
      'leader_wallet', v_clan.leader_wallet,
      'created_at', v_clan.created_at
    ),
    'members', COALESCE(v_members, '[]'::json),
    'my_role', v_my_role,
    'pending_requests', v_pending_count
  );
END;
$$;

-- Get clan leaderboard
CREATE OR REPLACE FUNCTION public.get_clan_leaderboard()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result json;
BEGIN
  SELECT json_agg(row_to_json(c)) INTO v_result
  FROM (
    SELECT 
      cl.id,
      cl.name,
      cl.emblem,
      cl.level,
      cl.leader_wallet,
      (SELECT p.display_name FROM profiles p WHERE p.wallet_address = cl.leader_wallet LIMIT 1) as leader_name,
      (SELECT count(*) FROM clan_members cm WHERE cm.clan_id = cl.id) as member_count,
      cl.max_members,
      COALESCE(
        (SELECT sum(COALESCE(
          (SELECT pr.elo FROM pvp_ratings pr WHERE pr.wallet_address = cm2.wallet_address ORDER BY pr.elo DESC LIMIT 1),
          1000
        )) FROM clan_members cm2 WHERE cm2.clan_id = cl.id),
        0
      ) as total_elo
    FROM clans cl
    ORDER BY total_elo DESC
    LIMIT 50
  ) c;

  RETURN json_build_object('success', true, 'leaderboard', COALESCE(v_result, '[]'::json));
END;
$$;

-- Search clans
CREATE OR REPLACE FUNCTION public.search_clans(p_query text DEFAULT NULL)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result json;
BEGIN
  SELECT json_agg(row_to_json(c)) INTO v_result
  FROM (
    SELECT 
      cl.id,
      cl.name,
      cl.description,
      cl.emblem,
      cl.level,
      cl.join_policy,
      cl.leader_wallet,
      (SELECT p.display_name FROM profiles p WHERE p.wallet_address = cl.leader_wallet LIMIT 1) as leader_name,
      (SELECT count(*) FROM clan_members cm WHERE cm.clan_id = cl.id) as member_count,
      cl.max_members
    FROM clans cl
    WHERE (p_query IS NULL OR cl.name ILIKE '%' || p_query || '%')
    ORDER BY cl.level DESC, cl.name
    LIMIT 50
  ) c;

  RETURN json_build_object('success', true, 'clans', COALESCE(v_result, '[]'::json));
END;
$$;

-- Get pending requests for a clan
CREATE OR REPLACE FUNCTION public.get_clan_requests(p_wallet text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_clan_id uuid;
  v_role text;
  v_result json;
BEGIN
  SELECT clan_id, role INTO v_clan_id, v_role FROM clan_members WHERE wallet_address = p_wallet;
  
  IF v_clan_id IS NULL OR v_role NOT IN ('leader', 'deputy', 'officer') THEN
    RETURN json_build_object('success', false, 'error', 'Нет прав для просмотра заявок');
  END IF;

  SELECT json_agg(row_to_json(r)) INTO v_result
  FROM (
    SELECT 
      cjr.id,
      cjr.wallet_address,
      cjr.message,
      cjr.created_at,
      p.display_name,
      COALESCE(
        (SELECT pr.elo FROM pvp_ratings pr WHERE pr.wallet_address = cjr.wallet_address ORDER BY pr.elo DESC LIMIT 1),
        1000
      ) as elo,
      (SELECT gd.account_level FROM game_data gd WHERE gd.wallet_address = cjr.wallet_address LIMIT 1) as account_level
    FROM clan_join_requests cjr
    LEFT JOIN profiles p ON p.wallet_address = cjr.wallet_address
    WHERE cjr.clan_id = v_clan_id AND cjr.status = 'pending'
    ORDER BY cjr.created_at
  ) r;

  RETURN json_build_object('success', true, 'requests', COALESCE(v_result, '[]'::json));
END;
$$;

-- Updated_at trigger for clans
CREATE OR REPLACE FUNCTION public.update_clans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_clans_updated_at
  BEFORE UPDATE ON public.clans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_clans_updated_at();
