-- Fix: PostgreSQL treats NULL values as distinct, so unique constraint doesn't prevent duplicates
-- Step 1: Clean up duplicate dungeon teams (keep only the most recently updated one)
DELETE FROM player_teams a
WHERE a.team_type = 'dungeon' 
  AND a.tier IS NULL
  AND EXISTS (
    SELECT 1 FROM player_teams b
    WHERE b.wallet_address = a.wallet_address 
      AND b.team_type = 'dungeon' 
      AND b.tier IS NULL
      AND b.updated_at > a.updated_at
  );

-- Step 2: Drop the old constraint that doesn't handle NULLs properly
ALTER TABLE player_teams DROP CONSTRAINT IF EXISTS player_teams_wallet_type_tier_unique;

-- Step 3: Create a unique index that properly handles NULL tier values
-- Using COALESCE to make NULL tiers compare as equal
DROP INDEX IF EXISTS player_teams_unique_wallet_type_tier;
CREATE UNIQUE INDEX player_teams_unique_wallet_type_tier 
ON player_teams (wallet_address, team_type, COALESCE(tier, -1));

-- Step 4: Update the update_player_team function to handle NULL comparison correctly
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
DECLARE
  v_existing_id UUID;
BEGIN
  -- Find existing record handling NULL tier properly
  SELECT id INTO v_existing_id
  FROM player_teams
  WHERE wallet_address = p_wallet_address
    AND team_type = p_team_type
    AND (tier = p_tier OR (tier IS NULL AND p_tier IS NULL))
  LIMIT 1;
  
  IF v_existing_id IS NOT NULL THEN
    -- Update existing record
    UPDATE player_teams
    SET team_data = p_team_data,
        updated_at = now()
    WHERE id = v_existing_id;
  ELSE
    -- Insert new record
    INSERT INTO player_teams (wallet_address, team_type, tier, team_data)
    VALUES (p_wallet_address, p_team_type, p_tier, p_team_data);
  END IF;
  
  RETURN true;
END;
$$;