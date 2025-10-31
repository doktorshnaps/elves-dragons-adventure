-- Change card_upgrade_requirements to support "from -> to" rarity upgrades
-- Add from_rarity and to_rarity columns
ALTER TABLE public.card_upgrade_requirements 
  ADD COLUMN IF NOT EXISTS from_rarity integer,
  ADD COLUMN IF NOT EXISTS to_rarity integer;

-- Update existing records: assume current rarity is "from", and "to" is +1
UPDATE public.card_upgrade_requirements
SET 
  from_rarity = CAST(rarity AS integer),
  to_rarity = CAST(rarity AS integer) + 1
WHERE from_rarity IS NULL;

-- Make the new columns NOT NULL after populating them
ALTER TABLE public.card_upgrade_requirements 
  ALTER COLUMN from_rarity SET NOT NULL,
  ALTER COLUMN to_rarity SET NOT NULL;

-- Drop old constraint if exists
ALTER TABLE public.card_upgrade_requirements 
  DROP CONSTRAINT IF EXISTS card_upgrade_requirements_card_type_rarity_key;

-- Create unique constraint for card_type + from_rarity + to_rarity
CREATE UNIQUE INDEX IF NOT EXISTS card_upgrade_requirements_card_type_from_to_rarity_key 
  ON public.card_upgrade_requirements(card_type, from_rarity, to_rarity) 
  WHERE is_active = true;