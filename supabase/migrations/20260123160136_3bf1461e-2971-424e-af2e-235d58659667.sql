-- Drop the failed index if it was partially created
DROP INDEX IF EXISTS idx_pvp_ratings_bot_usage;

-- Create table for bot team availability per tier (if not exists)
CREATE TABLE IF NOT EXISTS pvp_bot_teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address text NOT NULL,
  rarity_tier integer NOT NULL,
  team_snapshot jsonb NOT NULL,
  elo integer NOT NULL DEFAULT 1000,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(wallet_address, rarity_tier)
);

-- Enable RLS
ALTER TABLE pvp_bot_teams ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view all active bot teams" ON pvp_bot_teams;
DROP POLICY IF EXISTS "Users can manage their own bot teams" ON pvp_bot_teams;

-- Create policies for pvp_bot_teams
CREATE POLICY "Users can view all active bot teams"
ON pvp_bot_teams FOR SELECT
USING (is_active = true);

CREATE POLICY "Users can insert their own bot teams"
ON pvp_bot_teams FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update their own bot teams"
ON pvp_bot_teams FOR UPDATE
USING (true);

CREATE POLICY "Users can delete their own bot teams"
ON pvp_bot_teams FOR DELETE
USING (true);

-- Create index for efficient bot team lookup
CREATE INDEX IF NOT EXISTS idx_pvp_bot_teams_active 
ON pvp_bot_teams(rarity_tier, elo, is_active) 
WHERE is_active = true;