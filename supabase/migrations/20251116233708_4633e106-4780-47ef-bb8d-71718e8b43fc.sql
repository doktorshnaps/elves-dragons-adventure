-- Create table for treasure hunt events
CREATE TABLE IF NOT EXISTS public.treasure_hunt_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_name TEXT NOT NULL,
  item_image_url TEXT,
  total_quantity INTEGER NOT NULL,
  found_quantity INTEGER DEFAULT 0,
  max_winners INTEGER NOT NULL,
  reward_amount INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT false,
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  created_by_wallet_address TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create table for treasure hunt findings
CREATE TABLE IF NOT EXISTS public.treasure_hunt_findings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.treasure_hunt_events(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  found_quantity INTEGER NOT NULL,
  reward_claimed BOOLEAN DEFAULT false,
  found_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(event_id, wallet_address)
);

-- Enable RLS
ALTER TABLE public.treasure_hunt_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treasure_hunt_findings ENABLE ROW LEVEL SECURITY;

-- Policies for treasure_hunt_events
CREATE POLICY "Anyone can view active events"
  ON public.treasure_hunt_events
  FOR SELECT
  USING (is_active = true OR is_admin_wallet());

CREATE POLICY "Only admins can insert events"
  ON public.treasure_hunt_events
  FOR INSERT
  WITH CHECK (is_admin_wallet());

CREATE POLICY "Only admins can update events"
  ON public.treasure_hunt_events
  FOR UPDATE
  USING (is_admin_wallet());

CREATE POLICY "Only admins can delete events"
  ON public.treasure_hunt_events
  FOR DELETE
  USING (is_admin_wallet());

-- Policies for treasure_hunt_findings
CREATE POLICY "Users can view all findings"
  ON public.treasure_hunt_findings
  FOR SELECT
  USING (true);

CREATE POLICY "System can insert findings"
  ON public.treasure_hunt_findings
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own findings"
  ON public.treasure_hunt_findings
  FOR UPDATE
  USING (wallet_address = get_current_user_wallet());

-- Create indexes
CREATE INDEX idx_treasure_hunt_events_active ON public.treasure_hunt_events(is_active);
CREATE INDEX idx_treasure_hunt_findings_event ON public.treasure_hunt_findings(event_id);
CREATE INDEX idx_treasure_hunt_findings_wallet ON public.treasure_hunt_findings(wallet_address);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION update_treasure_hunt_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER update_treasure_hunt_events_updated_at
  BEFORE UPDATE ON public.treasure_hunt_events
  FOR EACH ROW
  EXECUTE FUNCTION update_treasure_hunt_updated_at();

CREATE TRIGGER update_treasure_hunt_findings_updated_at
  BEFORE UPDATE ON public.treasure_hunt_findings
  FOR EACH ROW
  EXECUTE FUNCTION update_treasure_hunt_updated_at();