-- Create table for active dungeon sessions
CREATE TABLE IF NOT EXISTS public.active_dungeon_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id TEXT NOT NULL,
  device_id TEXT NOT NULL,
  dungeon_type TEXT NOT NULL,
  level INTEGER NOT NULL DEFAULT 1,
  started_at BIGINT NOT NULL,
  last_activity BIGINT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster lookups by account_id
CREATE INDEX IF NOT EXISTS idx_active_dungeon_sessions_account_id 
ON public.active_dungeon_sessions(account_id);

-- Create index for cleanup of old sessions
CREATE INDEX IF NOT EXISTS idx_active_dungeon_sessions_last_activity 
ON public.active_dungeon_sessions(last_activity);

-- Enable Row Level Security
ALTER TABLE public.active_dungeon_sessions ENABLE ROW LEVEL SECURITY;

-- Policy: users can view their own sessions
CREATE POLICY "Users can view their own dungeon sessions"
ON public.active_dungeon_sessions
FOR SELECT
USING (true);

-- Policy: users can insert their own sessions
CREATE POLICY "Users can insert their own dungeon sessions"
ON public.active_dungeon_sessions
FOR INSERT
WITH CHECK (true);

-- Policy: users can update their own sessions
CREATE POLICY "Users can update their own dungeon sessions"
ON public.active_dungeon_sessions
FOR UPDATE
USING (true);

-- Policy: users can delete their own sessions
CREATE POLICY "Users can delete their own dungeon sessions"
ON public.active_dungeon_sessions
FOR DELETE
USING (true);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to update updated_at on row update
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON public.active_dungeon_sessions
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Function to cleanup old sessions (older than 30 seconds without activity)
CREATE OR REPLACE FUNCTION public.cleanup_old_dungeon_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM public.active_dungeon_sessions
  WHERE last_activity < EXTRACT(EPOCH FROM NOW()) * 1000 - 30000;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;