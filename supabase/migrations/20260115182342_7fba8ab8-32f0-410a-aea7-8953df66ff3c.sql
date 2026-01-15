-- Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "game_data_select_policy" ON public.game_data;

-- Create a stricter SELECT policy - users can only see their own data
CREATE POLICY "game_data_select_policy" 
ON public.game_data 
FOR SELECT 
TO authenticated
USING (user_id = auth.uid());

-- Admin SELECT policy is kept separate for admin panel functionality
-- But we should verify it's truly needed and properly secured