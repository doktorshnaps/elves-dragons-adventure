-- Create table for tracking wallet connections
CREATE TABLE public.wallet_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  connected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  disconnected_at TIMESTAMP WITH TIME ZONE NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  user_agent TEXT NULL,
  ip_address TEXT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.wallet_connections ENABLE ROW LEVEL SECURITY;

-- Create policies for wallet connections
CREATE POLICY "Anyone can view wallet connections" 
ON public.wallet_connections 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can insert wallet connections" 
ON public.wallet_connections 
FOR INSERT 
WITH CHECK (wallet_address IS NOT NULL);

CREATE POLICY "Anyone can update wallet connections" 
ON public.wallet_connections 
FOR UPDATE 
USING (wallet_address IS NOT NULL);

-- Create index for better performance
CREATE INDEX idx_wallet_connections_address ON public.wallet_connections(wallet_address);
CREATE INDEX idx_wallet_connections_active ON public.wallet_connections(is_active);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_wallet_connections_updated_at
BEFORE UPDATE ON public.wallet_connections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();