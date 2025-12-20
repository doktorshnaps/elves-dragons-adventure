-- Fix game_data RLS vulnerability: tighten policies to prevent data exposure
-- Issue: INSERT policy allows creating records with any wallet_address

-- Drop existing problematic policies
DROP POLICY IF EXISTS "game_data_insert_policy" ON public.game_data;
DROP POLICY IF EXISTS "game_data_select_policy" ON public.game_data;
DROP POLICY IF EXISTS "game_data_update_policy" ON public.game_data;

-- Create stricter INSERT policy
-- Only allow inserting if user_id matches auth.uid()
CREATE POLICY "game_data_insert_policy" ON public.game_data
  FOR INSERT
  WITH CHECK (
    (auth.uid() IS NOT NULL AND user_id = auth.uid())
  );

-- Create stricter SELECT policy  
-- Users can only see their own game data (by user_id)
-- Wallet address matching is secondary check via subquery
CREATE POLICY "game_data_select_policy" ON public.game_data
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL 
    AND (
      user_id = auth.uid()
      OR wallet_address IN (
        SELECT gd.wallet_address 
        FROM public.game_data gd 
        WHERE gd.user_id = auth.uid()
      )
    )
  );

-- Create stricter UPDATE policy
CREATE POLICY "game_data_update_policy" ON public.game_data
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL 
    AND user_id = auth.uid()
  );

-- Add admin access for support operations
CREATE POLICY "game_data_admin_select_policy" ON public.game_data
  FOR SELECT
  USING (
    is_admin_or_super_wallet(get_current_user_wallet())
  );

CREATE POLICY "game_data_admin_update_policy" ON public.game_data
  FOR UPDATE
  USING (
    is_admin_or_super_wallet(get_current_user_wallet())
  );