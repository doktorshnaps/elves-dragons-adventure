-- Fix RLS policy for soul_donations to work with wallet addresses instead of auth
DROP POLICY IF EXISTS "Users can insert their own soul donations" ON soul_donations;

-- Create new policy that allows inserts based on wallet address only
CREATE POLICY "Users can insert soul donations via wallet"
ON soul_donations
FOR INSERT
WITH CHECK (wallet_address IS NOT NULL AND length(trim(wallet_address)) > 0);

-- Keep the existing select policy
-- No changes needed for "Anyone can view soul donations" policy