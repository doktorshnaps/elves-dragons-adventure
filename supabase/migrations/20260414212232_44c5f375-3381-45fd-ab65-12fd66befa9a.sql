
CREATE TABLE public.client_error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  wallet_address TEXT,
  error_message TEXT NOT NULL,
  error_stack TEXT,
  error_source TEXT,
  page_url TEXT,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

ALTER TABLE public.client_error_logs ENABLE ROW LEVEL SECURITY;

-- Anyone can insert errors
CREATE POLICY "Anyone can insert error logs"
  ON public.client_error_logs FOR INSERT
  WITH CHECK (true);

-- Only admins can read
CREATE POLICY "Admins can read error logs"
  ON public.client_error_logs FOR SELECT
  TO authenticated
  USING (is_admin_or_super_wallet(get_current_user_wallet()));

-- Only super admins can delete (cleanup)
CREATE POLICY "Super admins can delete error logs"
  ON public.client_error_logs FOR DELETE
  TO authenticated
  USING (is_admin_or_super_wallet(get_current_user_wallet()));

CREATE INDEX idx_client_error_logs_created ON public.client_error_logs(created_at DESC);
CREATE INDEX idx_client_error_logs_source ON public.client_error_logs(error_source);
