-- Create table for building configurations
CREATE TABLE public.building_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  building_id TEXT NOT NULL,
  building_name TEXT NOT NULL,
  level INTEGER NOT NULL,
  production_per_hour INTEGER DEFAULT 0,
  cost_wood INTEGER DEFAULT 0,
  cost_stone INTEGER DEFAULT 0,
  cost_iron INTEGER DEFAULT 0,
  cost_gold INTEGER DEFAULT 0,
  cost_ell INTEGER DEFAULT 0,
  cost_gt NUMERIC DEFAULT 0,
  required_items JSONB DEFAULT '[]'::jsonb,
  required_main_hall_level INTEGER DEFAULT 0,
  upgrade_time_hours INTEGER DEFAULT 1,
  storage_capacity INTEGER DEFAULT 0,
  working_hours INTEGER DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by_wallet_address TEXT NOT NULL,
  UNIQUE(building_id, level)
);

-- Enable RLS
ALTER TABLE public.building_configs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view active building configs"
ON public.building_configs
FOR SELECT
USING (is_active = true);

CREATE POLICY "Only admins can insert building configs"
ON public.building_configs
FOR INSERT
WITH CHECK (is_admin_wallet());

CREATE POLICY "Only admins can update building configs"
ON public.building_configs
FOR UPDATE
USING (is_admin_wallet());

CREATE POLICY "Only admins can delete building configs"
ON public.building_configs
FOR DELETE
USING (is_admin_wallet());

-- Create index for faster lookups
CREATE INDEX idx_building_configs_building_id ON public.building_configs(building_id, level);
CREATE INDEX idx_building_configs_active ON public.building_configs(is_active);

-- Create trigger for updated_at
CREATE TRIGGER update_building_configs_updated_at
BEFORE UPDATE ON public.building_configs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default configurations for sawmill
INSERT INTO public.building_configs (building_id, building_name, level, production_per_hour, cost_wood, cost_stone, created_by_wallet_address)
VALUES
  ('sawmill', 'Лесопилка', 1, 60, 0, 0, 'system'),
  ('sawmill', 'Лесопилка', 2, 81, 2200, 990, 'system'),
  ('sawmill', 'Лесопилка', 3, 109, 3960, 1782, 'system'),
  ('sawmill', 'Лесопилка', 4, 147, 7128, 3207, 'system'),
  ('sawmill', 'Лесопилка', 5, 198, 12830, 5773, 'system'),
  ('sawmill', 'Лесопилка', 6, 267, 23094, 10392, 'system'),
  ('sawmill', 'Лесопилка', 7, 360, 41570, 18706, 'system'),
  ('sawmill', 'Лесопилка', 8, 486, 74826, 33671, 'system');

-- Insert default configurations for quarry
INSERT INTO public.building_configs (building_id, building_name, level, production_per_hour, cost_wood, cost_stone, created_by_wallet_address)
VALUES
  ('quarry', 'Каменоломня', 1, 30, 0, 0, 'system'),
  ('quarry', 'Каменоломня', 2, 39, 562, 1250, 'system'),
  ('quarry', 'Каменоломня', 3, 51, 1012, 2250, 'system'),
  ('quarry', 'Каменоломня', 4, 67, 1822, 4050, 'system'),
  ('quarry', 'Каменоломня', 5, 89, 3280, 7290, 'system'),
  ('quarry', 'Каменоломня', 6, 118, 5904, 13122, 'system'),
  ('quarry', 'Каменоломня', 7, 156, 10628, 23619, 'system'),
  ('quarry', 'Каменоломня', 8, 207, 19131, 42515, 'system');

-- Insert default configurations for warehouse (storage)
INSERT INTO public.building_configs (building_id, building_name, level, working_hours, cost_wood, cost_stone, created_by_wallet_address)
VALUES
  ('storage', 'Склад', 1, 1, 0, 0, 'system'),
  ('storage', 'Склад', 2, 2, 500, 500, 'system'),
  ('storage', 'Склад', 3, 4, 1000, 1000, 'system'),
  ('storage', 'Склад', 4, 6, 2000, 2000, 'system'),
  ('storage', 'Склад', 5, 12, 4000, 4000, 'system'),
  ('storage', 'Склад', 6, 18, 8000, 8000, 'system'),
  ('storage', 'Склад', 7, 24, 16000, 16000, 'system'),
  ('storage', 'Склад', 8, 48, 32000, 32000, 'system');