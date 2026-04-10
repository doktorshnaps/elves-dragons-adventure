-- Fix: Replace permissive public SELECT on wallet_whitelist_nft_access
-- with owner-scoped policy so users can only read their own NFT access records

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone can read nft access records" ON public.wallet_whitelist_nft_access;

-- Allow authenticated users to read only their own records
CREATE POLICY "Users can view own nft access"
  ON public.wallet_whitelist_nft_access
  FOR SELECT
  TO authenticated
  USING (wallet_address = get_current_user_wallet());

-- Allow admins to read all records
CREATE POLICY "Admins can view all nft access"
  ON public.wallet_whitelist_nft_access
  FOR SELECT
  TO authenticated
  USING (is_admin_or_super_wallet(get_current_user_wallet()));