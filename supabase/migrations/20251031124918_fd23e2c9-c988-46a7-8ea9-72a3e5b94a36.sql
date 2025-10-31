
-- Enable RLS on crafting_recipes if not already enabled
ALTER TABLE public.crafting_recipes ENABLE ROW LEVEL SECURITY;

-- Policy: Allow everyone to read active recipes
CREATE POLICY "Anyone can read active crafting recipes"
ON public.crafting_recipes
FOR SELECT
USING (is_active = true);

-- Policy: Allow admins to insert recipes
CREATE POLICY "Admins can insert crafting recipes"
ON public.crafting_recipes
FOR INSERT
WITH CHECK (
  public.is_admin_or_super_wallet(
    COALESCE(
      (SELECT wallet_address FROM public.game_data WHERE user_id = auth.uid() LIMIT 1),
      created_by_wallet_address
    )
  )
  OR created_by_wallet_address = 'mr_bruts.tg'
);

-- Policy: Allow admins to update recipes
CREATE POLICY "Admins can update crafting recipes"
ON public.crafting_recipes
FOR UPDATE
USING (
  public.is_admin_or_super_wallet(
    (SELECT wallet_address FROM public.game_data WHERE user_id = auth.uid() LIMIT 1)
  )
);

-- Policy: Allow admins to delete recipes
CREATE POLICY "Admins can delete crafting recipes"
ON public.crafting_recipes
FOR DELETE
USING (
  public.is_admin_or_super_wallet(
    (SELECT wallet_address FROM public.game_data WHERE user_id = auth.uid() LIMIT 1)
  )
);
