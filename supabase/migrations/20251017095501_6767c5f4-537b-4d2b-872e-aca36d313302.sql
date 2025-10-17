-- Создаем политики для bucket card-images
-- Удаляем старые политики если есть
DROP POLICY IF EXISTS "Admins can upload card images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view card images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update card images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete card images" ON storage.objects;

-- Политика для просмотра изображений карт (публичный доступ)
CREATE POLICY "Anyone can view card images"
ON storage.objects FOR SELECT
USING (bucket_id = 'card-images');

-- Политика для загрузки изображений карт (только администраторы)
CREATE POLICY "Admins can upload card images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'card-images' 
  AND is_admin_or_super_wallet(
    COALESCE(
      (SELECT wallet_address FROM public.game_data WHERE user_id = auth.uid() LIMIT 1),
      (SELECT wallet_address FROM public.profiles WHERE user_id = auth.uid() LIMIT 1)
    )
  )
);

-- Политика для обновления изображений карт (только администраторы)
CREATE POLICY "Admins can update card images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'card-images' 
  AND is_admin_or_super_wallet(
    COALESCE(
      (SELECT wallet_address FROM public.game_data WHERE user_id = auth.uid() LIMIT 1),
      (SELECT wallet_address FROM public.profiles WHERE user_id = auth.uid() LIMIT 1)
    )
  )
);

-- Политика для удаления изображений карт (только администраторы)
CREATE POLICY "Admins can delete card images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'card-images' 
  AND is_admin_or_super_wallet(
    COALESCE(
      (SELECT wallet_address FROM public.game_data WHERE user_id = auth.uid() LIMIT 1),
      (SELECT wallet_address FROM public.profiles WHERE user_id = auth.uid() LIMIT 1)
    )
  )
);