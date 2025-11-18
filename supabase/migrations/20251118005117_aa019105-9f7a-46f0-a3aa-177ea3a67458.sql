-- Enable RLS on treasure_hunt_findings if not already enabled
ALTER TABLE public.treasure_hunt_findings ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view treasure hunt findings (for leaderboard)
CREATE POLICY "Anyone can view treasure hunt findings"
ON public.treasure_hunt_findings
FOR SELECT
TO public
USING (true);

-- Only service role can insert findings (through edge functions)
CREATE POLICY "Service role can insert findings"
ON public.treasure_hunt_findings
FOR INSERT
TO service_role
WITH CHECK (true);

-- Only service role can update findings (through edge functions)
CREATE POLICY "Service role can update findings"
ON public.treasure_hunt_findings
FOR UPDATE
TO service_role
USING (true);