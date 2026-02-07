-- Allow public read access to completed pvp matches for match history
CREATE POLICY "Anyone can view completed matches"
ON public.pvp_matches
FOR SELECT
USING (status = 'completed');
