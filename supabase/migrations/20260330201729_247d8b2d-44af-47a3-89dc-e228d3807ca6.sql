
-- Fix 1: Restrict quest progress UPDATE to service_role only
-- All quest progress mutations happen through SECURITY DEFINER RPCs
-- (update_daily_quest_progress, claim_daily_quest_reward, claim_quest_and_reward)
-- so direct client UPDATE should be blocked.

-- Drop existing permissive UPDATE policies
DROP POLICY IF EXISTS "user_quest_progress_update_policy" ON public.user_quest_progress;
DROP POLICY IF EXISTS "Users can update own quest progress" ON public.user_daily_quest_progress;

-- Create service_role-only UPDATE policies
CREATE POLICY "service_role_update_quest_progress"
ON public.user_quest_progress
FOR UPDATE TO service_role
USING (true);

CREATE POLICY "service_role_update_daily_quest_progress"
ON public.user_daily_quest_progress
FOR UPDATE TO service_role
USING (true);

-- Fix 2: Ensure no one can DELETE banned_users records except service_role
CREATE POLICY "service_role_delete_banned_users"
ON public.banned_users
FOR DELETE TO service_role
USING (true);
