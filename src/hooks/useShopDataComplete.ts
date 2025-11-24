import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export interface ShopDataComplete {
  shop_inventory: Array<{
    id: string;
    item_id: number;
    available_quantity: number;
    last_reset_time: string;
    next_reset_time: string;
    item_template: {
      id: number;
      item_id: string;
      name: string;
      type: string;
      rarity: string;
      description: string;
      image_url: string;
      value: number;
      sell_price: number;
      level_requirement: number;
      stats: any;
    };
  }>;
  user_balance: number;
  user_inventory: Array<{
    id: string;
    template_id: number;
    item_id: string;
    name: string;
    type: string;
  }>;
  item_templates: Array<{
    id: number;
    item_id: string;
    name: string;
    type: string;
    rarity: string;
    description: string;
    image_url: string;
    value: number;
    sell_price: number;
    level_requirement: number;
    stats: any;
    source_type: string;
    slot: string;
  }>;
  user_profile: {
    user_id: string;
    wallet_address: string;
    account_level: number;
    account_experience: number;
    initialized: boolean;
  };
  purchase_history: Array<{
    item_id: number;
    item_name: string;
    purchased_at: string;
  }>;
  shop_settings: {
    id: string;
    items_per_refresh: number;
    refresh_interval_hours: number;
    is_open_access: boolean;
    created_at: string;
    updated_at: string;
  };
}

/**
 * Phase 4: Shop Data Optimization Hook
 * 
 * Fetches all shop-related data in a single RPC call.
 * Reduces 7 separate queries to 1 atomic operation.
 * 
 * Features:
 * - 5-minute cache (staleTime)
 * - 10-minute garbage collection
 * - No refetch on window focus
 * - Automatic retry with exponential backoff
 * 
 * @param walletAddress - User's wallet address
 * @returns Shop data with loading/error states
 */
export const useShopDataComplete = (walletAddress: string | null) => {
  const queryClient = useQueryClient();
  
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['shopDataComplete', walletAddress],
    queryFn: async (): Promise<ShopDataComplete | null> => {
      if (!walletAddress) {
        console.warn('[useShopDataComplete] No wallet address provided');
        return null;
      }

      console.log('🛒 [useShopDataComplete] Fetching complete shop data for:', walletAddress);

      // Use raw SQL query since RPC function is not in types yet
      const { data, error } = await supabase.rpc('get_shop_data_complete' as any, {
        p_wallet_address: walletAddress
      });

      if (error) {
        console.error('❌ [useShopDataComplete] Error:', error);
        throw error;
      }

      if (!data) {
        console.warn('[useShopDataComplete] No data returned');
        return null;
      }

      // Parse JSONB response
      const shopData = typeof data === 'string' ? JSON.parse(data) : data;

      console.log('✅ [useShopDataComplete] Complete shop data loaded:', {
        shopItems: shopData.shop_inventory?.length || 0,
        balance: shopData.user_balance,
        inventoryItems: shopData.user_inventory?.length || 0,
        templates: shopData.item_templates?.length || 0,
        purchaseHistory: shopData.purchase_history?.length || 0
      });

      return shopData as ShopDataComplete;
    },
    enabled: !!walletAddress,
    staleTime: 5 * 60 * 1000, // 5 minutes - shop data changes infrequently
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });

  // Real-time subscription for shop_inventory changes only
  // Note: item_instances Real-time handled by ItemInstancesProvider to avoid duplicates
  useEffect(() => {
    if (!walletAddress) return;

    console.log('🔄 [useShopDataComplete] Setting up Real-time subscription for shop_inventory');

    const channel = supabase
      .channel('shop-inventory-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shop_inventory'
        },
        (payload) => {
          console.log('🔔 [useShopDataComplete] shop_inventory changed:', payload);
          queryClient.invalidateQueries({ queryKey: ['shopDataComplete', walletAddress] });
        }
      )
      .subscribe();

    return () => {
      console.log('🔄 [useShopDataComplete] Cleaning up Real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [walletAddress, queryClient]);

  return {
    shopData: data,
    isLoading,
    error,
    refetch,
  };
};
