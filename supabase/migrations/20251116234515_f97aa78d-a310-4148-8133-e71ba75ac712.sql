-- Add columns to treasure_hunt_events for item template and drop settings
ALTER TABLE public.treasure_hunt_events 
  ADD COLUMN IF NOT EXISTS item_template_id INTEGER REFERENCES public.item_templates(id),
  ADD COLUMN IF NOT EXISTS monster_id TEXT,
  ADD COLUMN IF NOT EXISTS drop_chance NUMERIC DEFAULT 1.0,
  ADD COLUMN IF NOT EXISTS dungeon_number INTEGER;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_treasure_hunt_events_item_template ON public.treasure_hunt_events(item_template_id);
CREATE INDEX IF NOT EXISTS idx_treasure_hunt_events_monster ON public.treasure_hunt_events(monster_id);