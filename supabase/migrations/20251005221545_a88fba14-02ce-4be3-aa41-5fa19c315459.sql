-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Admins can manage quests" ON public.quests;
DROP POLICY IF EXISTS "Admins can upload quest images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update quest images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete quest images" ON storage.objects;

-- Create function to check if wallet is admin (including mr_bruts.tg)
CREATE OR REPLACE FUNCTION public.is_quest_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(get_current_user_wallet(), '') = 'mr_bruts.tg' OR is_admin_wallet();
$$;

-- Update quests policies
CREATE POLICY "Admins can manage quests"
  ON public.quests FOR ALL
  USING (is_quest_admin())
  WITH CHECK (is_quest_admin());

-- Update storage policies for quest images
CREATE POLICY "Admins can upload quest images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'quest-images' AND is_quest_admin());

CREATE POLICY "Admins can update quest images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'quest-images' AND is_quest_admin());

CREATE POLICY "Admins can delete quest images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'quest-images' AND is_quest_admin());