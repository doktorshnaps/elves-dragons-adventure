-- Create maintenance mode table
CREATE TABLE public.maintenance_mode (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  is_enabled boolean NOT NULL DEFAULT false,
  message text,
  enabled_by_wallet_address text NOT NULL DEFAULT 'mr_bruts.tg',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.maintenance_mode ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view maintenance status" 
ON public.maintenance_mode 
FOR SELECT 
USING (true);

CREATE POLICY "Only admin can manage maintenance mode" 
ON public.maintenance_mode 
FOR ALL 
USING (enabled_by_wallet_address = 'mr_bruts.tg' OR is_admin_wallet());

-- Insert initial record
INSERT INTO public.maintenance_mode (is_enabled, message, enabled_by_wallet_address)
VALUES (false, 'Ведутся технические работы. Игра временно недоступна.', 'mr_bruts.tg');

-- Create function to toggle maintenance mode
CREATE OR REPLACE FUNCTION public.admin_toggle_maintenance_mode(
  p_enabled boolean, 
  p_message text DEFAULT NULL,
  p_admin_wallet_address text DEFAULT 'mr_bruts.tg'
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Check if caller is admin
  IF p_admin_wallet_address != 'mr_bruts.tg' THEN
    RAISE EXCEPTION 'Unauthorized: Only admin can toggle maintenance mode';
  END IF;

  -- Update maintenance mode status
  UPDATE public.maintenance_mode 
  SET 
    is_enabled = p_enabled,
    message = COALESCE(p_message, message),
    enabled_by_wallet_address = p_admin_wallet_address,
    updated_at = now();

  RETURN TRUE;
END;
$$;

-- Create function to get maintenance status
CREATE OR REPLACE FUNCTION public.get_maintenance_status()
RETURNS jsonb
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT jsonb_build_object(
    'is_enabled', is_enabled,
    'message', message,
    'updated_at', updated_at
  )
  FROM public.maintenance_mode
  ORDER BY updated_at DESC
  LIMIT 1;
$$;