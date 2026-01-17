-- ============================================================
-- SECURITY FIX: mgt_exchange_requests INSERT policy
-- Ensure users can only create exchange requests for their own wallet
-- ============================================================

-- Drop existing INSERT policy if exists
DROP POLICY IF EXISTS "Users can create exchange requests" ON public.mgt_exchange_requests;
DROP POLICY IF EXISTS "Users can insert their own exchange requests" ON public.mgt_exchange_requests;
DROP POLICY IF EXISTS "Anyone can insert exchange requests" ON public.mgt_exchange_requests;

-- Create secure INSERT policy that validates wallet ownership
-- Uses get_current_user_wallet() to ensure the wallet_address matches the authenticated user
CREATE POLICY "Users can only create requests for their own wallet"
ON public.mgt_exchange_requests
FOR INSERT
TO authenticated
WITH CHECK (
  wallet_address = get_current_user_wallet()
);

-- Ensure RLS is enabled
ALTER TABLE public.mgt_exchange_requests ENABLE ROW LEVEL SECURITY;

-- Verify SELECT policy exists (users should only see their own requests)
DROP POLICY IF EXISTS "Users can view their own exchange requests" ON public.mgt_exchange_requests;
CREATE POLICY "Users can view their own exchange requests"
ON public.mgt_exchange_requests
FOR SELECT
TO authenticated
USING (wallet_address = get_current_user_wallet());

-- Add UPDATE policy - users can only update their own pending requests
DROP POLICY IF EXISTS "Users can update their own pending requests" ON public.mgt_exchange_requests;
CREATE POLICY "Users can update their own pending requests"
ON public.mgt_exchange_requests
FOR UPDATE
TO authenticated
USING (wallet_address = get_current_user_wallet() AND status = 'pending')
WITH CHECK (wallet_address = get_current_user_wallet());

-- Admin policies for processing requests
DROP POLICY IF EXISTS "Admins can view all exchange requests" ON public.mgt_exchange_requests;
CREATE POLICY "Admins can view all exchange requests"
ON public.mgt_exchange_requests
FOR SELECT
TO authenticated
USING (check_is_current_user_admin());

DROP POLICY IF EXISTS "Admins can update all exchange requests" ON public.mgt_exchange_requests;
CREATE POLICY "Admins can update all exchange requests"
ON public.mgt_exchange_requests
FOR UPDATE
TO authenticated
USING (check_is_current_user_admin())
WITH CHECK (check_is_current_user_admin());