-- Drop the overpermissive UPDATE policy on wallet_connections
-- The 'wallet_connections_update_own' policy already provides correct ownership-scoped restriction
DROP POLICY IF EXISTS "Authenticated users can update wallet connections" ON public.wallet_connections;