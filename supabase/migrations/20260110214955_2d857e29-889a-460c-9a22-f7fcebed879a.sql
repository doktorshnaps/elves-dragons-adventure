-- Create table for mGT exchange requests
CREATE TABLE public.mgt_exchange_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount >= 2000),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  processed_by TEXT,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.mgt_exchange_requests ENABLE ROW LEVEL SECURITY;

-- Players can view their own requests
CREATE POLICY "Users can view own exchange requests"
ON public.mgt_exchange_requests
FOR SELECT
USING (wallet_address = get_current_user_wallet());

-- Players can create their own requests
CREATE POLICY "Users can create own exchange requests"
ON public.mgt_exchange_requests
FOR INSERT
WITH CHECK (wallet_address = get_current_user_wallet());

-- Admins can view all requests (only 'admin' role)
CREATE POLICY "Admins can view all exchange requests"
ON public.mgt_exchange_requests
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE wallet_address = get_current_user_wallet()
    AND role = 'admin'
  )
);

-- Admins can update requests
CREATE POLICY "Admins can update exchange requests"
ON public.mgt_exchange_requests
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE wallet_address = get_current_user_wallet()
    AND role = 'admin'
  )
);

-- Create indexes for faster lookups
CREATE INDEX idx_mgt_exchange_requests_wallet ON public.mgt_exchange_requests(wallet_address);
CREATE INDEX idx_mgt_exchange_requests_status ON public.mgt_exchange_requests(status);

-- Add trigger for updated_at
CREATE TRIGGER update_mgt_exchange_requests_updated_at
BEFORE UPDATE ON public.mgt_exchange_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();