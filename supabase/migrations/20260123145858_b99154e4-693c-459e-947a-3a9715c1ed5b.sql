-- Create player_teams table for storing different team compositions
CREATE TABLE public.player_teams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  team_type TEXT NOT NULL CHECK (team_type IN ('dungeon', 'pvp')),
  tier INTEGER DEFAULT NULL, -- NULL for dungeon, 1-8 for PvP tiers
  team_data JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Unique constraint: one team per type/tier combination per player
  CONSTRAINT unique_player_team UNIQUE (wallet_address, team_type, tier)
);

-- Create index for fast lookups
CREATE INDEX idx_player_teams_wallet ON public.player_teams(wallet_address);
CREATE INDEX idx_player_teams_type_tier ON public.player_teams(team_type, tier);

-- Enable RLS
ALTER TABLE public.player_teams ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own teams"
  ON public.player_teams
  FOR SELECT
  USING (wallet_address = current_setting('request.headers', true)::json->>'x-wallet-address'
    OR wallet_address IN (
      SELECT wallet_address FROM public.wallet_connections 
      WHERE is_active = true
    ));

CREATE POLICY "Users can insert their own teams"
  ON public.player_teams
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own teams"
  ON public.player_teams
  FOR UPDATE
  USING (true);

CREATE POLICY "Users can delete their own teams"
  ON public.player_teams
  FOR DELETE
  USING (true);

-- Update timestamp trigger
CREATE TRIGGER update_player_teams_updated_at
  BEFORE UPDATE ON public.player_teams
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RPC to get or create a team for a specific type/tier
CREATE OR REPLACE FUNCTION public.get_or_create_player_team(
  p_wallet_address TEXT,
  p_team_type TEXT,
  p_tier INTEGER DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_team JSONB;
BEGIN
  -- Try to get existing team
  SELECT team_data INTO v_team
  FROM player_teams
  WHERE wallet_address = p_wallet_address
    AND team_type = p_team_type
    AND (
      (p_tier IS NULL AND tier IS NULL) OR
      (p_tier IS NOT NULL AND tier = p_tier)
    );
  
  -- If not found, create empty team
  IF v_team IS NULL THEN
    INSERT INTO player_teams (wallet_address, team_type, tier, team_data)
    VALUES (p_wallet_address, p_team_type, p_tier, '[]'::jsonb)
    ON CONFLICT (wallet_address, team_type, tier) DO NOTHING
    RETURNING team_data INTO v_team;
    
    -- If still null (race condition), fetch again
    IF v_team IS NULL THEN
      SELECT team_data INTO v_team
      FROM player_teams
      WHERE wallet_address = p_wallet_address
        AND team_type = p_team_type
        AND (
          (p_tier IS NULL AND tier IS NULL) OR
          (p_tier IS NOT NULL AND tier = p_tier)
        );
    END IF;
  END IF;
  
  RETURN COALESCE(v_team, '[]'::jsonb);
END;
$$;

-- RPC to update a specific team
CREATE OR REPLACE FUNCTION public.update_player_team(
  p_wallet_address TEXT,
  p_team_type TEXT,
  p_tier INTEGER DEFAULT NULL,
  p_team_data JSONB DEFAULT '[]'::jsonb
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO player_teams (wallet_address, team_type, tier, team_data)
  VALUES (p_wallet_address, p_team_type, p_tier, p_team_data)
  ON CONFLICT (wallet_address, team_type, tier)
  DO UPDATE SET 
    team_data = p_team_data,
    updated_at = now();
  
  RETURN true;
END;
$$;

-- RPC to get all teams for a player
CREATE OR REPLACE FUNCTION public.get_all_player_teams(
  p_wallet_address TEXT
)
RETURNS TABLE(
  team_type TEXT,
  tier INTEGER,
  team_data JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT pt.team_type, pt.tier, pt.team_data
  FROM player_teams pt
  WHERE pt.wallet_address = p_wallet_address
  ORDER BY pt.team_type, pt.tier;
END;
$$;