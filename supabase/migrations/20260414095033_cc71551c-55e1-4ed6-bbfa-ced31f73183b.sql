-- Fix 1: Remove overly permissive soul_donations policy
DROP POLICY IF EXISTS "Authenticated users can view donations" ON public.soul_donations;

-- Fix 2: Tighten data_changes select policy to exclude NULL wallet_address rows
DROP POLICY IF EXISTS "data_changes_select_policy" ON public.data_changes;

CREATE POLICY "data_changes_select_policy"
ON public.data_changes
FOR SELECT
TO authenticated
USING (
  wallet_address IS NOT NULL
  AND auth.uid() IS NOT NULL
  AND wallet_address = get_current_user_wallet()
);