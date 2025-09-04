-- Remove the overly permissive policy that allows anyone to view wallet connections
DROP POLICY IF EXISTS "Anyone can view wallet connections" ON public.wallet_connections;

-- Create a more restrictive policy that prevents public access to wallet connection data
-- Since this is a wallet-based system without traditional auth, we'll restrict all SELECT access
-- The application can still INSERT and UPDATE connection records, but reading is restricted
CREATE POLICY "No public access to wallet connections" 
ON public.wallet_connections 
FOR SELECT 
USING (false);