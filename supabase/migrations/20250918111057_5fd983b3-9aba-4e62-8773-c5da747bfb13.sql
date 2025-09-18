-- Remove specific items from item_templates table
DELETE FROM item_templates WHERE item_id IN (
  'sword_iron',
  'helmet_leather', 
  'ring_strength',
  'sword_flame',
  'amulet_wisdom'
);