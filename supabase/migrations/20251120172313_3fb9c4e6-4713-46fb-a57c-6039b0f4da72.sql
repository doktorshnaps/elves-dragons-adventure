-- Update class_multipliers for hero Mage -> Wizard
UPDATE class_multipliers 
SET class_name = 'Чародей' 
WHERE class_name = 'Маг';