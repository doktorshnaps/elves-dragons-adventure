-- Drop old restrictive policies
DROP POLICY IF EXISTS "Service role can insert findings" ON public.treasure_hunt_findings;
DROP POLICY IF EXISTS "Service role can update findings" ON public.treasure_hunt_findings;

-- Allow authenticated and anon users to insert findings
CREATE POLICY "Anyone can insert treasure hunt findings"
ON public.treasure_hunt_findings
FOR INSERT
TO public
WITH CHECK (true);

-- Allow authenticated and anon users to update findings
CREATE POLICY "Anyone can update treasure hunt findings"
ON public.treasure_hunt_findings
FOR UPDATE
TO public
USING (true);