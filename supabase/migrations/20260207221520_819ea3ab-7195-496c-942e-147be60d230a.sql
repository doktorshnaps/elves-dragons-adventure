
CREATE OR REPLACE FUNCTION public.get_clan_profile(p_clan_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_clan record;
  v_members json;
  v_member_count integer;
  v_total_elo bigint;
BEGIN
  SELECT * INTO v_clan FROM clans WHERE id = p_clan_id;
  
  IF v_clan IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Клан не найден');
  END IF;

  SELECT count(*) INTO v_member_count FROM clan_members WHERE clan_id = p_clan_id;

  SELECT COALESCE(sum(COALESCE(
    (SELECT pr.elo FROM pvp_ratings pr WHERE pr.wallet_address = cm.wallet_address ORDER BY pr.elo DESC LIMIT 1),
    1000
  )), 0) INTO v_total_elo
  FROM clan_members cm WHERE cm.clan_id = p_clan_id;

  SELECT json_agg(row_to_json(m)) INTO v_members
  FROM (
    SELECT cm.wallet_address, cm.role, cm.joined_at,
           p.display_name,
           COALESCE(
             (SELECT pr.elo FROM pvp_ratings pr WHERE pr.wallet_address = cm.wallet_address ORDER BY pr.elo DESC LIMIT 1),
             1000
           ) as elo
    FROM clan_members cm
    LEFT JOIN profiles p ON p.wallet_address = cm.wallet_address
    WHERE cm.clan_id = p_clan_id
    ORDER BY 
      CASE cm.role 
        WHEN 'leader' THEN 1 
        WHEN 'deputy' THEN 2 
        WHEN 'officer' THEN 3 
        ELSE 4 
      END,
      cm.joined_at
    LIMIT 20
  ) m;

  RETURN json_build_object(
    'success', true,
    'clan', json_build_object(
      'id', v_clan.id,
      'name', v_clan.name,
      'description', v_clan.description,
      'emblem', v_clan.emblem,
      'header_background', v_clan.header_background,
      'level', v_clan.level,
      'experience', v_clan.experience,
      'treasury_ell', v_clan.treasury_ell,
      'max_members', v_clan.max_members,
      'join_policy', v_clan.join_policy,
      'leader_wallet', v_clan.leader_wallet,
      'created_at', v_clan.created_at,
      'social_links', v_clan.social_links,
      'member_count', v_member_count,
      'total_elo', v_total_elo
    ),
    'members', COALESCE(v_members, '[]'::json)
  );
END;
$$;
