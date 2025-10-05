-- Relax storage policies to allow uploads from the admin UI (bucket-scoped)
DROP POLICY IF EXISTS "Admins can upload quest images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update quest images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete quest images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload quest images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update quest images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete quest images" ON storage.objects;

CREATE POLICY "Anyone can upload quest images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'quest-images');

CREATE POLICY "Anyone can update quest images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'quest-images');

CREATE POLICY "Anyone can delete quest images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'quest-images');

-- Admin RPC to upsert quests securely (no default params)
CREATE OR REPLACE FUNCTION public.admin_upsert_quest(
  p_admin_wallet_address text,
  p_id uuid,
  p_title text,
  p_description text,
  p_link_url text,
  p_image_url text,
  p_reward_coins integer,
  p_is_active boolean,
  p_display_order integer
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  IF NOT is_admin_wallet(p_admin_wallet_address) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF p_id IS NULL THEN
    INSERT INTO public.quests (title, description, link_url, image_url, reward_coins, is_active, display_order, created_by_wallet_address)
    VALUES (p_title, p_description, p_link_url, p_image_url, p_reward_coins, p_is_active, p_display_order, p_admin_wallet_address)
    RETURNING id INTO v_id;
  ELSE
    UPDATE public.quests
    SET title = p_title,
        description = p_description,
        link_url = p_link_url,
        image_url = p_image_url,
        reward_coins = p_reward_coins,
        is_active = p_is_active,
        display_order = p_display_order,
        updated_at = now()
    WHERE id = p_id
    RETURNING id INTO v_id;
  END IF;

  RETURN v_id;
END;
$$;

-- Admin RPC to delete quest
CREATE OR REPLACE FUNCTION public.admin_delete_quest(
  p_admin_wallet_address text,
  p_id uuid
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_admin_wallet(p_admin_wallet_address) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  DELETE FROM public.quests WHERE id = p_id;
  RETURN FOUND;
END;
$$;