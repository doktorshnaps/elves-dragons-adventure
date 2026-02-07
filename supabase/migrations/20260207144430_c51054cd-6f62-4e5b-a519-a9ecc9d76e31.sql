
-- Add background_image column to clans
ALTER TABLE public.clans ADD COLUMN IF NOT EXISTS background_image text;

-- Create storage bucket for clan assets (emblems + backgrounds)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('clan-assets', 'clan-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to view clan assets
CREATE POLICY "Clan assets are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'clan-assets');

-- Allow authenticated users to upload to their clan folder
CREATE POLICY "Clan leaders can upload assets"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'clan-assets');

-- Allow updates to clan assets
CREATE POLICY "Clan leaders can update assets"
ON storage.objects FOR UPDATE
USING (bucket_id = 'clan-assets');

-- Allow deletes of clan assets
CREATE POLICY "Clan leaders can delete assets"
ON storage.objects FOR DELETE
USING (bucket_id = 'clan-assets');

-- RPC to update clan customization (emblem + background)
CREATE OR REPLACE FUNCTION public.update_clan_customization(
  p_wallet text,
  p_emblem text DEFAULT NULL,
  p_background_image text DEFAULT NULL
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
    RETURN jsonb_build_object('success', false, 'error', 'Только глава или заместитель могут менять оформление');
  END IF;

  -- Update clan
  UPDATE clans SET
    emblem = COALESCE(p_emblem, emblem),
    background_image = COALESCE(p_background_image, background_image),
    updated_at = now()
  WHERE id = v_clan_id;

  RETURN jsonb_build_object('success', true);
END;
$$;
