import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useWalletContext } from '@/contexts/WalletConnectContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export interface ItemInstance {
  id: string;
  user_id?: string;
  wallet_address: string;
  template_id?: number;
  item_id?: string;
  name?: string;
  type?: string;
  created_at: string;
  updated_at: string;
}

export const useItemInstances = () => {
  const { accountId } = useWalletContext();
  const queryClient = useQueryClient();

  // Use React Query for data fetching and caching with reduced cache time
  const { data: instances = [], isLoading: loading, refetch: refetchQuery } = useQuery({
    queryKey: ['itemInstances', accountId],
    queryFn: async () => {
      if (!accountId) return [];

      console.log('🔄 [useItemInstances] Fetching item instances for:', accountId);

      const { data, error } = await supabase
        .rpc('get_item_instances_by_wallet', { p_wallet_address: accountId });

      if (error) {
        console.error('❌ [useItemInstances] Error fetching items:', error);
        throw error;
      }
      
      const totalItems = data?.length || 0;
      const cardPacks = data?.filter(item => item.type === 'cardPack').length || 0;
      const materials = data?.filter(item => item.type === 'material').length || 0;
      
      console.log('✅ [useItemInstances] Loaded', totalItems, 'items:', {
        total: totalItems,
        cardPacks,
        materials,
        other: totalItems - cardPacks - materials
      });
      
      return (data as ItemInstance[]) || [];
    },
    enabled: !!accountId,
    staleTime: 30 * 60 * 1000, // 30 минут - агрессивное кеширование (было 2 мин)
    gcTime: 60 * 60 * 1000, // 60 минут (было 5 мин)
    refetchOnWindowFocus: false,
    refetchOnMount: false, // НЕ перезагружать при каждом монтировании
  });

  const refetch = useCallback(async () => {
    console.log('🔄 [useItemInstances] Manual refetch requested');
    queryClient.invalidateQueries({ queryKey: ['itemInstances', accountId] });
    return await refetchQuery();
  }, [queryClient, accountId, refetchQuery]);

  // Real-time subscription for INSERT/DELETE/UPDATE events in item_instances
  useEffect(() => {
    if (!accountId) return;

    console.log('🔄 [useItemInstances] Setting up Real-time subscription for item_instances');

    const channel = supabase
      .channel('item-instances-realtime')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'item_instances',
          filter: `wallet_address=eq.${accountId}`
        },
        (payload) => {
          console.log('🔔 [useItemInstances] Item change detected via Real-time:', payload.eventType, payload);
          // Invalidate and refetch immediately for DELETE/UPDATE
          queryClient.invalidateQueries({ 
            queryKey: ['itemInstances', accountId]
          });
        }
      )
      .subscribe();

    return () => {
      console.log('🔄 [useItemInstances] Cleaning up Real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [accountId, queryClient]);

  // Window events removed - Real-time subscription handles all updates

  /**
   * Add N new item instances to DB
   */
  const addItemInstances = async (items: Array<{ template_id?: number; item_id?: string; name?: string; type?: string }>) => {
    if (!accountId || items.length === 0) return;

    try {
      const rows = items.map(it => ({
        wallet_address: accountId,
        template_id: it.template_id ?? null,
        item_id: it.item_id ?? null,
        name: it.name ?? null,
        type: it.type ?? 'material'
      }));

      const { error } = await supabase
        .from('item_instances')
        .insert(rows);

      if (error) throw error;
      
      // Invalidate and refetch
      refetch();
    } catch (e) {
      console.error('❌ Failed to add item_instances:', e);
    }
  };

  /**
   * Remove N item instances by their UUIDs using RPC to bypass RLS
   */
  const removeItemInstancesByIds = async (ids: string[]) => {
    if (!accountId || ids.length === 0) {
      return;
    }

    try {
      // Use RPC to bypass RLS (similar to add_item_instances)
      const { data, error } = await supabase.rpc('remove_item_instances', {
        p_wallet_address: accountId,
        p_instance_ids: ids
      });

      if (error) {
        throw error;
      }
      
      // Invalidate and refetch
      refetch();
    } catch (e) {
      console.error('❌ [removeItemInstancesByIds] Failed to remove item_instances:', e);
      throw e; // Пробрасываем ошибку дальше, чтобы handleUpgrade мог её обработать
    }
  };

  /**
   * Group instances by item_id, returning counts
   */
  const getCountsByItemId = useCallback((): Record<string, number> => {
    const counts: Record<string, number> = {};
    instances.forEach(inst => {
      const key = inst.item_id || inst.name || 'unknown';
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  }, [instances]);

  /**
   * Get all instances matching a given item_id
   */
  const getInstancesByItemId = useCallback((itemId: string): ItemInstance[] => {
    return instances.filter(inst => inst.item_id === itemId);
  }, [instances]);

  return {
    instances,
    loading,
    addItemInstances,
    removeItemInstancesByIds,
    getCountsByItemId,
    getInstancesByItemId,
    refetch
  };
};
