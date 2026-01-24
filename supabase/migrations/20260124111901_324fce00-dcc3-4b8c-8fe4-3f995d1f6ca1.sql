-- =============================================
-- Fix: Remove duplicate join_pvp_queue function
-- There are two versions with slightly different argument orders
-- This drops the older one and keeps only the version with DEFAULT
-- =============================================

-- Drop the function without default (older signature)
DROP FUNCTION IF EXISTS public.join_pvp_queue(text, text, integer, jsonb);

-- Verify the remaining function has the correct signature
-- (p_wallet_address text, p_rarity_tier integer, p_team_snapshot jsonb, p_match_type text DEFAULT 'ranked')
-- This should already exist from the previous migration