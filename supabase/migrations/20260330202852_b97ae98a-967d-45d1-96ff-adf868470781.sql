
-- Fix: Users can self-approve MGT exchange requests
-- Drop the existing permissive UPDATE policy and recreate with proper WITH CHECK
DROP POLICY IF EXISTS "Users can update their own pending requests" ON public.mgt_exchange_requests;

CREATE POLICY "Users can update their own pending requests"
ON public.mgt_exchange_requests
FOR UPDATE
TO authenticated
USING (wallet_address = get_current_user_wallet() AND status = 'pending')
WITH CHECK (wallet_address = get_current_user_wallet() AND status = 'pending');
