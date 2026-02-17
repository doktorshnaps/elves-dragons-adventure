
-- Create clan_raid_events table
CREATE TABLE public.clan_raid_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  boss_name text NOT NULL,
  boss_image text,
  boss_description text,
  total_hp bigint NOT NULL DEFAULT 100000000,
  current_hp bigint NOT NULL DEFAULT 100000000,
  max_hp bigint NOT NULL DEFAULT 100000000,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'defeated', 'expired')),
  started_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz NOT NULL,
  rewards_distributed boolean NOT NULL DEFAULT false,
  winner_clan_id uuid REFERENCES public.clans(id) ON DELETE SET NULL,
  created_by text NOT NULL,
  reward_first_place bigint NOT NULL DEFAULT 500,
  reward_second_place bigint NOT NULL DEFAULT 200,
  reward_participant bigint NOT NULL DEFAULT 50,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create clan_raid_attacks table
CREATE TABLE public.clan_raid_attacks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  raid_event_id uuid NOT NULL REFERENCES public.clan_raid_events(id) ON DELETE CASCADE,
  wallet_address text NOT NULL,
  clan_id uuid NOT NULL REFERENCES public.clans(id) ON DELETE CASCADE,
  damage_dealt bigint NOT NULL DEFAULT 0,
  team_snapshot jsonb,
  attacked_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(raid_event_id, wallet_address)
);

-- Create clan_raid_rankings table
CREATE TABLE public.clan_raid_rankings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  raid_event_id uuid NOT NULL REFERENCES public.clan_raid_events(id) ON DELETE CASCADE,
  clan_id uuid NOT NULL REFERENCES public.clans(id) ON DELETE CASCADE,
  clan_name text NOT NULL DEFAULT '',
  clan_emblem text,
  total_damage bigint NOT NULL DEFAULT 0,
  members_participated integer NOT NULL DEFAULT 0,
  rank integer,
  UNIQUE(raid_event_id, clan_id)
);

-- Indexes for performance
CREATE INDEX idx_clan_raid_attacks_raid_event ON public.clan_raid_attacks(raid_event_id);
CREATE INDEX idx_clan_raid_attacks_clan ON public.clan_raid_attacks(clan_id);
CREATE INDEX idx_clan_raid_rankings_raid_event ON public.clan_raid_rankings(raid_event_id);
CREATE INDEX idx_clan_raid_events_status ON public.clan_raid_events(status);

-- Enable RLS
ALTER TABLE public.clan_raid_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clan_raid_attacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clan_raid_rankings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for clan_raid_events
CREATE POLICY "Anyone can view raid events"
  ON public.clan_raid_events FOR SELECT
  USING (true);

CREATE POLICY "No direct insert on raid events"
  ON public.clan_raid_events FOR INSERT
  WITH CHECK (false);

CREATE POLICY "No direct update on raid events"
  ON public.clan_raid_events FOR UPDATE
  USING (false);

CREATE POLICY "No direct delete on raid events"
  ON public.clan_raid_events FOR DELETE
  USING (false);

-- RLS Policies for clan_raid_attacks
CREATE POLICY "Anyone can view raid attacks"
  ON public.clan_raid_attacks FOR SELECT
  USING (true);

CREATE POLICY "No direct insert on raid attacks"
  ON public.clan_raid_attacks FOR INSERT
  WITH CHECK (false);

CREATE POLICY "No direct update on raid attacks"
  ON public.clan_raid_attacks FOR UPDATE
  USING (false);

CREATE POLICY "No direct delete on raid attacks"
  ON public.clan_raid_attacks FOR DELETE
  USING (false);

-- RLS Policies for clan_raid_rankings
CREATE POLICY "Anyone can view raid rankings"
  ON public.clan_raid_rankings FOR SELECT
  USING (true);

CREATE POLICY "No direct insert on raid rankings"
  ON public.clan_raid_rankings FOR INSERT
  WITH CHECK (false);

CREATE POLICY "No direct update on raid rankings"
  ON public.clan_raid_rankings FOR UPDATE
  USING (false);

CREATE POLICY "No direct delete on raid rankings"
  ON public.clan_raid_rankings FOR DELETE
  USING (false);

-- Trigger to update updated_at on clan_raid_events
CREATE OR REPLACE FUNCTION public.update_clan_raid_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_clan_raid_events_updated_at
  BEFORE UPDATE ON public.clan_raid_events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_clan_raid_events_updated_at();
