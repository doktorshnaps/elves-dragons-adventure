-- Fix 1: Remove overpermissive public policy on pvp_matches that exposes team snapshots
DROP POLICY IF EXISTS "Anyone can view active matches" ON public.pvp_matches;