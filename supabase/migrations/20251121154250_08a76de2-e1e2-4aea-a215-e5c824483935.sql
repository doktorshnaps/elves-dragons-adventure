-- Add required_buildings column to building_configs table
ALTER TABLE public.building_configs 
ADD COLUMN IF NOT EXISTS required_buildings jsonb DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.building_configs.required_buildings IS 'Required building levels for this upgrade: [{"building_id": "main_hall", "level": 1}]';