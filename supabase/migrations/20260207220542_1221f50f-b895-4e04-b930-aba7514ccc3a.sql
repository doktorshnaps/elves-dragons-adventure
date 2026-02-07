
-- Add social_links column to clans table
ALTER TABLE public.clans ADD COLUMN social_links jsonb DEFAULT '{}';

-- Create/replace RPC for updating clan info (description + social links)
CREATE OR REPLACE FUNCTION public.update_clan_info(
  p_wallet text,
  p_description text DEFAULT NULL,
  p_social_links jsonb DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_clan_id uuid;
  v_role text;
BEGIN
  -- Check membership and role
  SELECT cm.clan_id, cm.role INTO v_clan_id, v_role
  FROM clan_members cm
  WHERE cm.wallet_address = p_wallet;

  IF v_clan_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Вы не состоите в клане');
  END IF;

  IF v_role NOT IN ('leader', 'deputy') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Только глава или заместитель могут менять информацию клана');
  END IF;

  -- Validate description length
  IF p_description IS NOT NULL AND length(p_description) > 500 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Описание не может быть длиннее 500 символов');
  END IF;

  -- Update clan
  UPDATE clans SET
    description = COALESCE(p_description, description),
    social_links = COALESCE(p_social_links, social_links),
    updated_at = now()
  WHERE id = v_clan_id;

  RETURN jsonb_build_object('success', true);
END;
$$;
