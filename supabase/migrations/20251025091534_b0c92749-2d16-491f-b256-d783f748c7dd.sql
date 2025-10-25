-- Создаем bucket для изображений предметов если не существует
INSERT INTO storage.buckets (id, name, public)
VALUES ('item-images', 'item-images', true)
ON CONFLICT (id) DO NOTHING;

-- Удаляем старые политики если есть
DROP POLICY IF EXISTS "Super admin can upload item images" ON storage.objects;
DROP POLICY IF EXISTS "Super admin can update item images" ON storage.objects;
DROP POLICY IF EXISTS "Super admin can delete item images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view item images" ON storage.objects;

-- Политика для публичного чтения
CREATE POLICY "Public can view item images"
ON storage.objects FOR SELECT
USING (bucket_id = 'item-images');

-- Политика для загрузки (INSERT) для super_admin
CREATE POLICY "Super admin can upload item images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'item-images' AND
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE wallet_address = (SELECT auth.jwt() ->> 'wallet_address')
    AND role = 'super_admin'
  )
);

-- Политика для обновления (UPDATE) для super_admin
CREATE POLICY "Super admin can update item images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'item-images' AND
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE wallet_address = (SELECT auth.jwt() ->> 'wallet_address')
    AND role = 'super_admin'
  )
);

-- Политика для удаления (DELETE) для super_admin
CREATE POLICY "Super admin can delete item images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'item-images' AND
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE wallet_address = (SELECT auth.jwt() ->> 'wallet_address')
    AND role = 'super_admin'
  )
);