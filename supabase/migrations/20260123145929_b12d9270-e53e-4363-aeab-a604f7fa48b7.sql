-- Drop overly permissive RLS policies
DROP POLICY IF EXISTS "Users can insert their own teams" ON public.player_teams;
DROP POLICY IF EXISTS "Users can update their own teams" ON public.player_teams;
DROP POLICY IF EXISTS "Users can delete their own teams" ON public.player_teams;

-- Create proper RLS policies with wallet_address check
CREATE POLICY "Users can insert their own teams"
  ON public.player_teams
  FOR INSERT
  WITH CHECK (
    wallet_address IN (
      SELECT wc.wallet_address FROM public.wallet_connections wc
      WHERE wc.is_active = true
    )
  );

CREATE POLICY "Users can update their own teams"
  ON public.player_teams
  FOR UPDATE
  USING (
    wallet_address IN (
      SELECT wc.wallet_address FROM public.wallet_connections wc
      WHERE wc.is_active = true
    )
  );

CREATE POLICY "Users can delete their own teams"
  ON public.player_teams
  FOR DELETE
  USING (
    wallet_address IN (
      SELECT wc.wallet_address FROM public.wallet_connections wc
      WHERE wc.is_active = true
    )
  );