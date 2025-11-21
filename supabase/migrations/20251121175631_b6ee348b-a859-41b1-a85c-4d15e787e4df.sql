-- Create shop_settings table for managing shop configuration
CREATE TABLE IF NOT EXISTS public.shop_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  items_per_refresh integer NOT NULL DEFAULT 50,
  refresh_interval_hours integer NOT NULL DEFAULT 24,
  is_open_access boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by_wallet_address text NOT NULL
);

-- Enable RLS
ALTER TABLE public.shop_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for shop_settings
CREATE POLICY "Anyone can view shop settings"
  ON public.shop_settings
  FOR SELECT
  USING (true);

CREATE POLICY "Only admins can insert shop settings"
  ON public.shop_settings
  FOR INSERT
  WITH CHECK (public.is_admin_or_super_wallet(public.get_current_user_wallet()));

CREATE POLICY "Only admins can update shop settings"
  ON public.shop_settings
  FOR UPDATE
  USING (public.is_admin_or_super_wallet(public.get_current_user_wallet()));

CREATE POLICY "Only admins can delete shop settings"
  ON public.shop_settings
  FOR DELETE
  USING (public.is_admin_or_super_wallet(public.get_current_user_wallet()));

-- Insert default settings
INSERT INTO public.shop_settings (items_per_refresh, refresh_interval_hours, is_open_access, created_by_wallet_address)
VALUES (50, 24, false, 'mr_bruts.tg')
ON CONFLICT DO NOTHING;

-- Create function to get current shop settings
CREATE OR REPLACE FUNCTION public.get_shop_settings()
RETURNS TABLE (
  id uuid,
  items_per_refresh integer,
  refresh_interval_hours integer,
  is_open_access boolean,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.items_per_refresh,
    s.refresh_interval_hours,
    s.is_open_access,
    s.created_at,
    s.updated_at
  FROM public.shop_settings s
  ORDER BY s.created_at DESC
  LIMIT 1;
END;
$$;

-- Create function to update shop settings
CREATE OR REPLACE FUNCTION public.admin_update_shop_settings(
  p_admin_wallet_address text,
  p_items_per_refresh integer,
  p_refresh_interval_hours integer,
  p_is_open_access boolean
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user is admin
  IF NOT public.is_admin_or_super_wallet(p_admin_wallet_address) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can update shop settings';
  END IF;

  -- Update or insert settings
  INSERT INTO public.shop_settings (
    items_per_refresh,
    refresh_interval_hours,
    is_open_access,
    created_by_wallet_address,
    updated_at
  )
  VALUES (
    p_items_per_refresh,
    p_refresh_interval_hours,
    p_is_open_access,
    p_admin_wallet_address,
    now()
  )
  ON CONFLICT (id) DO UPDATE
  SET
    items_per_refresh = EXCLUDED.items_per_refresh,
    refresh_interval_hours = EXCLUDED.refresh_interval_hours,
    is_open_access = EXCLUDED.is_open_access,
    updated_at = now();

  RETURN true;
END;
$$;