-- Drop existing unsafe policies
DROP POLICY IF EXISTS "System can insert shop inventory" ON public.shop_inventory;
DROP POLICY IF EXISTS "System can update shop inventory" ON public.shop_inventory;

-- Keep SELECT policy for everyone to view shop inventory
-- (Already exists: "Anyone can view shop inventory")

-- Create secure policies: only service role (edge functions) can modify
-- Regular users cannot INSERT or UPDATE directly
CREATE POLICY "Only service role can insert shop inventory"
ON public.shop_inventory
FOR INSERT
WITH CHECK (false);

CREATE POLICY "Only service role can update shop inventory"
ON public.shop_inventory
FOR UPDATE
USING (false);