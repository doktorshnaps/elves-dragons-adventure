
-- Add header_background column for the central panel image
ALTER TABLE public.clans ADD COLUMN IF NOT EXISTS header_background text;

-- Update the RPC to return header_background
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
      'background_image', v_clan.background_image,
      'header_background', v_clan.header_background,
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

-- Update customization RPC to support header_background
CREATE OR REPLACE FUNCTION public.update_clan_customization(
  p_wallet text,
  p_emblem text DEFAULT NULL,
  p_background_image text DEFAULT NULL,
  p_header_background text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_clan_id uuid;
  v_role text;
BEGIN
  SELECT cm.clan_id, cm.role INTO v_clan_id, v_role
  FROM clan_members cm
  WHERE cm.wallet_address = p_wallet;

  IF v_clan_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Вы не состоите в клане');
  END IF;

  IF v_role NOT IN ('leader', 'deputy') THEN
    RETURN json_build_object('success', false, 'error', 'Только глава и заместитель могут изменять оформление');
  END IF;

  IF p_emblem IS NOT NULL THEN
    UPDATE clans SET emblem = p_emblem, updated_at = now() WHERE id = v_clan_id;
  END IF;

  IF p_background_image IS NOT NULL THEN
    UPDATE clans SET background_image = p_background_image, updated_at = now() WHERE id = v_clan_id;
  END IF;

  IF p_header_background IS NOT NULL THEN
    UPDATE clans SET header_background = p_header_background, updated_at = now() WHERE id = v_clan_id;
  END IF;

  RETURN json_build_object('success', true);
END;
$$;
