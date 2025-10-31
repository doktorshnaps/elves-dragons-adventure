-- Add card_class and faction columns to card_upgrade_requirements
ALTER TABLE card_upgrade_requirements
ADD COLUMN card_class text,
ADD COLUMN faction text;

-- Create index for better query performance
CREATE INDEX idx_card_upgrade_requirements_class_faction 
ON card_upgrade_requirements(card_type, card_class, faction, from_rarity, to_rarity) 
WHERE is_active = true;

-- Update the unique constraint to include class and faction
DROP INDEX IF EXISTS card_upgrade_requirements_card_type_from_to_rarity_key;

CREATE UNIQUE INDEX card_upgrade_requirements_unique_config 
ON card_upgrade_requirements(card_type, COALESCE(card_class, ''), COALESCE(faction, ''), from_rarity, to_rarity) 
WHERE is_active = true;