
DROP POLICY IF EXISTS "Admins can insert exchange templates" ON public.item_exchange_templates;
DROP POLICY IF EXISTS "Admins can update exchange templates" ON public.item_exchange_templates;

CREATE POLICY "Admins can insert exchange templates"
  ON public.item_exchange_templates FOR INSERT
  TO authenticated
  WITH CHECK (is_admin_or_super_wallet(get_current_user_wallet()));

CREATE POLICY "Admins can update exchange templates"
  ON public.item_exchange_templates FOR UPDATE
  TO authenticated
  USING (is_admin_or_super_wallet(get_current_user_wallet()));

DROP POLICY IF EXISTS "Admins can update exchange settings" ON public.item_exchange_settings;

CREATE POLICY "Admins can update exchange settings"
  ON public.item_exchange_settings FOR UPDATE
  TO authenticated
  USING (is_admin_or_super_wallet(get_current_user_wallet()));
