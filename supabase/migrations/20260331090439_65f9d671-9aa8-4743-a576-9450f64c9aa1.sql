-- Fix vulnerable RLS policies on treasure_hunt_events
-- UPDATE and DELETE policies were checking the ROW's created_by_wallet_address
-- instead of the requesting user's wallet, allowing any user to mutate admin-owned rows

DROP POLICY IF EXISTS "Treasure hunt update by admin" ON public.treasure_hunt_events;
DROP POLICY IF EXISTS "Treasure hunt delete by admin" ON public.treasure_hunt_events;

-- Also drop overlapping policies from earlier migrations if they exist
DROP POLICY IF EXISTS "Only admins can update events" ON public.treasure_hunt_events;
DROP POLICY IF EXISTS "Only admins can delete events" ON public.treasure_hunt_events;
DROP POLICY IF EXISTS "Admins can update treasure hunt events" ON public.treasure_hunt_events;
DROP POLICY IF EXISTS "Admins can delete treasure hunt events" ON public.treasure_hunt_events;

-- Recreate UPDATE policy checking the REQUESTING user's wallet
CREATE POLICY "Treasure hunt update by admin"
ON public.treasure_hunt_events
FOR UPDATE
TO authenticated
USING (
  public.is_admin_or_super_wallet(public.get_current_user_wallet())
);

-- Recreate DELETE policy checking the REQUESTING user's wallet
CREATE POLICY "Treasure hunt delete by admin"
ON public.treasure_hunt_events
FOR DELETE
TO authenticated
USING (
  public.is_admin_or_super_wallet(public.get_current_user_wallet())
);

-- Also fix INSERT policy to use get_current_user_wallet() for the admin check
-- (the current one checks created_by_wallet_address which is fine for INSERT WITH CHECK,
-- but let's also restrict to authenticated only)
DROP POLICY IF EXISTS "Treasure hunt insert by admin wallet in payload" ON public.treasure_hunt_events;
DROP POLICY IF EXISTS "Only admins can insert events" ON public.treasure_hunt_events;
DROP POLICY IF EXISTS "Admins can insert treasure hunt events" ON public.treasure_hunt_events;

CREATE POLICY "Treasure hunt insert by admin"
ON public.treasure_hunt_events
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_admin_or_super_wallet(public.get_current_user_wallet())
);