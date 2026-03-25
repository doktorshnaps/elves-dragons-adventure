DROP POLICY IF EXISTS "Admins can insert exchange templates" ON public.item_exchange_templates;
DROP POLICY IF EXISTS "Admins can update exchange templates" ON public.item_exchange_templates;
DROP POLICY IF EXISTS "Admins can delete exchange templates" ON public.item_exchange_templates;
DROP POLICY IF EXISTS "Admins can view all exchange templates" ON public.item_exchange_templates;

CREATE POLICY "Admins can view all exchange templates"
  ON public.item_exchange_templates
  FOR SELECT
  TO public
  USING (
    is_admin_or_super_wallet(
      COALESCE((auth.jwt() ->> 'wallet_address'::text), get_current_user_wallet())
    )
  );

CREATE POLICY "Admins can insert exchange templates"
  ON public.item_exchange_templates
  FOR INSERT
  TO public
  WITH CHECK (
    is_admin_or_super_wallet(
      COALESCE((auth.jwt() ->> 'wallet_address'::text), get_current_user_wallet())
    )
  );

CREATE POLICY "Admins can update exchange templates"
  ON public.item_exchange_templates
  FOR UPDATE
  TO public
  USING (
    is_admin_or_super_wallet(
      COALESCE((auth.jwt() ->> 'wallet_address'::text), get_current_user_wallet())
    )
  )
  WITH CHECK (
    is_admin_or_super_wallet(
      COALESCE((auth.jwt() ->> 'wallet_address'::text), get_current_user_wallet())
    )
  );

CREATE POLICY "Admins can delete exchange templates"
  ON public.item_exchange_templates
  FOR DELETE
  TO public
  USING (
    is_admin_or_super_wallet(
      COALESCE((auth.jwt() ->> 'wallet_address'::text), get_current_user_wallet())
    )
  );

DROP POLICY IF EXISTS "Admins can update exchange settings" ON public.item_exchange_settings;

CREATE POLICY "Admins can update exchange settings"
  ON public.item_exchange_settings
  FOR UPDATE
  TO public
  USING (
    is_admin_or_super_wallet(
      COALESCE((auth.jwt() ->> 'wallet_address'::text), get_current_user_wallet())
    )
  )
  WITH CHECK (
    is_admin_or_super_wallet(
      COALESCE((auth.jwt() ->> 'wallet_address'::text), get_current_user_wallet())
    )
  );