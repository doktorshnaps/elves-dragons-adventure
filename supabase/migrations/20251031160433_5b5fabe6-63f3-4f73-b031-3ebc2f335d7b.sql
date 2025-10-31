-- Fix crafting_recipes RLS policies
-- Drop all existing policies
DROP POLICY IF EXISTS "Admins can delete crafting recipes" ON public.crafting_recipes;
DROP POLICY IF EXISTS "Admins can insert crafting recipes" ON public.crafting_recipes;
DROP POLICY IF EXISTS "Admins can update crafting recipes" ON public.crafting_recipes;
DROP POLICY IF EXISTS "Anyone can read active crafting recipes" ON public.crafting_recipes;
DROP POLICY IF EXISTS "Anyone can view active crafting recipes" ON public.crafting_recipes;
DROP POLICY IF EXISTS "Only admins can delete crafting recipes" ON public.crafting_recipes;
DROP POLICY IF EXISTS "Only admins can insert crafting recipes" ON public.crafting_recipes;
DROP POLICY IF EXISTS "Only admins can update crafting recipes" ON public.crafting_recipes;

-- Create optimized policies (no duplicates, with proper auth function calls)
CREATE POLICY "Anyone can view active crafting recipes" 
ON public.crafting_recipes 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Only admins can insert crafting recipes" 
ON public.crafting_recipes 
FOR INSERT 
WITH CHECK (is_admin_or_super_wallet((SELECT get_current_user_wallet())));

CREATE POLICY "Only admins can update crafting recipes" 
ON public.crafting_recipes 
FOR UPDATE 
USING (is_admin_or_super_wallet((SELECT get_current_user_wallet())));

CREATE POLICY "Only admins can delete crafting recipes" 
ON public.crafting_recipes 
FOR DELETE 
USING (is_admin_or_super_wallet((SELECT get_current_user_wallet())));