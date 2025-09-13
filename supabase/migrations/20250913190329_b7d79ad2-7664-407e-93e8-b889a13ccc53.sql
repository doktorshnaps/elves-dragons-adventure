-- Create whitelist table for access control
CREATE TABLE public.whitelist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT NOT NULL UNIQUE,
  added_by_wallet_address TEXT NOT NULL,
  added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.whitelist ENABLE ROW LEVEL SECURITY;

-- Create policies for whitelist access
CREATE POLICY "Admins can view all whitelist entries"
ON public.whitelist 
FOR SELECT 
USING (added_by_wallet_address = 'mr_bruts.tg');

CREATE POLICY "Admins can insert whitelist entries"
ON public.whitelist 
FOR INSERT 
WITH CHECK (added_by_wallet_address = 'mr_bruts.tg');

CREATE POLICY "Admins can update whitelist entries"
ON public.whitelist 
FOR UPDATE 
USING (added_by_wallet_address = 'mr_bruts.tg');

CREATE POLICY "Anyone can check if they are whitelisted"
ON public.whitelist 
FOR SELECT 
USING (wallet_address = get_current_user_wallet() AND is_active = true);

-- Function to check if wallet is whitelisted
CREATE OR REPLACE FUNCTION public.is_whitelisted(p_wallet_address text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.whitelist 
    WHERE wallet_address = p_wallet_address 
      AND is_active = true
  );
$$;

-- Admin functions for managing whitelist
CREATE OR REPLACE FUNCTION public.admin_add_to_whitelist(
  p_wallet_address text,
  p_notes text DEFAULT NULL,
  p_admin_wallet_address text DEFAULT 'mr_bruts.tg'
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Check if caller is admin
  IF p_admin_wallet_address != 'mr_bruts.tg' THEN
    RAISE EXCEPTION 'Unauthorized: Only admin can manage whitelist';
  END IF;

  -- Insert or update whitelist entry
  INSERT INTO public.whitelist (wallet_address, added_by_wallet_address, notes)
  VALUES (p_wallet_address, p_admin_wallet_address, p_notes)
  ON CONFLICT (wallet_address) 
  DO UPDATE SET 
    is_active = true,
    notes = EXCLUDED.notes,
    updated_at = now();

  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_remove_from_whitelist(
  p_wallet_address text,
  p_admin_wallet_address text DEFAULT 'mr_bruts.tg'
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Check if caller is admin
  IF p_admin_wallet_address != 'mr_bruts.tg' THEN
    RAISE EXCEPTION 'Unauthorized: Only admin can manage whitelist';
  END IF;

  -- Deactivate whitelist entry
  UPDATE public.whitelist 
  SET is_active = false, updated_at = now()
  WHERE wallet_address = p_wallet_address;

  RETURN TRUE;
END;
$$;

-- Add trigger for updated_at
CREATE TRIGGER update_whitelist_updated_at
BEFORE UPDATE ON public.whitelist
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();