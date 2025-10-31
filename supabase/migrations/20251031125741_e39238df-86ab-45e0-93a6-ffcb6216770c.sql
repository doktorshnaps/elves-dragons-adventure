-- Add crafting_time field to crafting_recipes table
ALTER TABLE public.crafting_recipes 
ADD COLUMN IF NOT EXISTS crafting_time_hours integer NOT NULL DEFAULT 1;

COMMENT ON COLUMN public.crafting_recipes.crafting_time_hours IS 'Time required to craft this item in hours';