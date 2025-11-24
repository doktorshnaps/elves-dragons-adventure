import { supabase } from '@/integrations/supabase/client';
import { QueryClient } from '@tanstack/react-query';

/**
 * BATCH REFETCH OPTIMIZATION
 * 
 * Fetches only shop and card data - item_instances syncs via Real-time subscription.
 * 
 * Before: 
 * - invalidate itemInstances → refetch (2 queries)
 * - invalidate cardInstances → refetch (2 queries)  
 * - invalidate shopData → refetch (2 queries)
 * Total: 6 queries
 * 
 * After:
 * - 2 parallel fetches (cards + shop)
 * - item_instances updated by Real-time subscription
 * Total: 2 queries
 * 
 * Reduction: -67% queries
 */

export interface BatchRefetchResult {
  cardInstances: any[];
  shopData: any;
}

/**
 * Fetch shop and card data (item_instances handled by Real-time)
 */
export const batchRefetchShopData = async (
  walletAddress: string,
  queryClient: QueryClient
): Promise<BatchRefetchResult> => {
  console.log('🔄 [batchRefetch] Starting batch refetch (item_instances via Real-time)');

  try {
    // Execute 2 RPC calls in parallel (item_instances syncs via Real-time subscription)
    const [cardsResponse, shopResponse] = await Promise.all([
      supabase.rpc('get_card_instances_by_wallet', { p_wallet_address: walletAddress }),
      supabase.rpc('get_shop_data_complete' as any, { p_wallet_address: walletAddress })
    ]);

    // Check for errors
    if (cardsResponse.error) throw cardsResponse.error;
    if (shopResponse.error) throw shopResponse.error;

    const result = {
      cardInstances: cardsResponse.data || [],
      shopData: typeof shopResponse.data === 'string' 
        ? JSON.parse(shopResponse.data) 
        : shopResponse.data
    };

    console.log('✅ [batchRefetch] Batch fetch complete:', {
      cards: result.cardInstances.length,
      balance: result.shopData?.user_balance
    });

    // Update query caches (no additional network requests)
    queryClient.setQueryData(['cardInstances', walletAddress], result.cardInstances);
    queryClient.setQueryData(['shopDataComplete', walletAddress], result.shopData);

    console.log('✅ [batchRefetch] Caches updated (item_instances syncing via Real-time)');

    return result;
  } catch (error) {
    console.error('❌ [batchRefetch] Batch fetch failed:', error);
    throw error;
  }
};

/**
 * Optimistic update for shop purchase
 * Updates local cache immediately without waiting for server
 */
export const optimisticShopPurchase = (
  queryClient: QueryClient,
  walletAddress: string,
  itemId: number,
  itemPrice: number,
  itemTemplate: any
) => {
  console.log('⚡ [optimisticUpdate] Applying optimistic purchase update');

  // Update shop data cache
  queryClient.setQueryData(['shopDataComplete', walletAddress], (oldData: any) => {
    if (!oldData) return oldData;
    return {
      ...oldData,
      user_balance: oldData.user_balance - itemPrice,
      shop_inventory: oldData.shop_inventory.map((inv: any) =>
        inv.item_id === itemId
          ? { ...inv, available_quantity: inv.available_quantity - 1 }
          : inv
      )
    };
  });

  // Add item to itemInstances cache (if not card pack)
  if (itemTemplate?.type !== 'cardPack') {
    queryClient.setQueryData(['itemInstances', walletAddress], (oldItems: any[] = []) => [
      ...oldItems,
      {
        id: `optimistic-${Date.now()}`,
        wallet_address: walletAddress,
        template_id: itemId,
        item_id: itemTemplate?.item_id,
        name: itemTemplate?.name,
        type: itemTemplate?.type,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ]);
  }

  console.log('✅ [optimisticUpdate] Cache updated optimistically');
};
