-- Оптимизация RLS политик для card_images: заменяем auth.uid() на (select auth.uid())
-- для улучшения производительности (значение вычисляется один раз, а не для каждой строки)

DROP POLICY IF EXISTS "Only admins can insert card images" ON public.card_images;

CREATE POLICY "Only admins can insert card images"
ON public.card_images
FOR INSERT
WITH CHECK (
  is_admin_wallet() 
  OR (
    EXISTS (
      SELECT 1
      FROM user_roles
      WHERE user_roles.user_id = (SELECT auth.uid())
        AND user_roles.role = 'super_admin'::app_role
    )
  )
);