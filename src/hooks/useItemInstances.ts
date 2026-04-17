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

const DEV = import.meta.env.DEV;

export const useItemInstances = () => {
  const { accountId } = useWalletContext();
  const queryClient = useQueryClient();

  // Use React Query for data fetching and caching with reduced cache time
  const { data: instances = [], isLoading: loading, refetch: refetchQuery } = useQuery({
    queryKey: ['itemInstances', accountId],
    queryFn: async () => {
      if (!accountId) return [];

      if (DEV) console.log('🔄 [useItemInstances] Fetching for:', accountId);

      const { data, error } = await supabase
        .rpc('get_item_instances_by_wallet', { p_wallet_address: accountId });

      if (error) {
        if (DEV) console.error('❌ [useItemInstances] Error:', error?.message || error);
        throw error;
      }

      if (DEV) {
        const totalItems = data?.length || 0;
        console.log('✅ [useItemInstances] Loaded', totalItems, 'items');
      }

      return (data as ItemInstance[]) || [];
    },
    enabled: !!accountId,
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });

  const refetch = useCallback(async () => {
    if (DEV) console.log('🔄 [useItemInstances] Manual refetch');
    queryClient.invalidateQueries({ queryKey: ['itemInstances', accountId] });
    return await refetchQuery();
  }, [queryClient, accountId, refetchQuery]);

  // Real-time subscription with init-guard + 200ms debounce. Prevents the
  // "double provider mount → double subscribe → 2x heavy refetch" pattern
  // observed on iOS WKWebView and the burst of 10+ invalidations from
  // batch UPDATEs during rewards.
  useEffect(() => {
    if (!accountId) return;

    if (DEV) console.log('🔄 [useItemInstances] Subscribe realtime');

    let pending: any = null;
    const flush = () => {
      pending = null;
      queryClient.invalidateQueries({ queryKey: ['itemInstances', accountId] });
    };

    const channel = supabase
      .channel(`item-instances-${accountId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'item_instances',
          filter: `wallet_address=eq.${accountId}`,
        },
        () => {
          if (pending) clearTimeout(pending);
          pending = setTimeout(flush, 200);
        }
      )
      .subscribe();

    return () => {
      if (DEV) console.log('🔄 [useItemInstances] Unsubscribe realtime');
      if (pending) clearTimeout(pending);
      supabase.removeChannel(channel);
    };
  }, [accountId, queryClient]);

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
