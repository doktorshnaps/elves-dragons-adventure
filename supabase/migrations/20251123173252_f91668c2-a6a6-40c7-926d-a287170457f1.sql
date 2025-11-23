-- Phase 2: Enable Realtime for shop_inventory table
-- This allows instant synchronization of shop updates across all clients

-- Set REPLICA IDENTITY to FULL for complete data in realtime updates
ALTER TABLE public.shop_inventory REPLICA IDENTITY FULL;

-- Add shop_inventory to supabase_realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.shop_inventory;

COMMENT ON TABLE public.shop_inventory IS 'Shop inventory with realtime updates enabled for instant synchronization';