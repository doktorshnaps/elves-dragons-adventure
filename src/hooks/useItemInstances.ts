import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useWalletContext } from '@/contexts/WalletConnectContext';

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
  const [instances, setInstances] = useState<ItemInstance[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInstances = useCallback(async () => {
    if (!accountId) {
      setInstances([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      // Используем RPC функцию для обхода RLS
      const { data, error } = await supabase
        .rpc('get_item_instances_by_wallet', { p_wallet_address: accountId });

      if (error) throw error;
      console.log('✅ [useItemInstances] Loaded instances:', data?.length || 0);
      setInstances((data as ItemInstance[]) || []);
    } catch (e) {
      console.error('❌ Failed to fetch item_instances:', e);
      setInstances([]);
    } finally {
      setLoading(false);
    }
  }, [accountId]);

  useEffect(() => {
    fetchInstances();

    // Realtime subscription to item_instances for this wallet
    const channel = supabase
      .channel(`item_instances:${accountId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'item_instances',
          filter: `wallet_address=eq.${accountId}`
        },
        () => {
          fetchInstances();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [accountId]);

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
      console.log('✅ Added', items.length, 'item instances to DB');
    } catch (e) {
      console.error('❌ Failed to add item_instances:', e);
    }
  };

  /**
   * Remove N item instances by their UUIDs using RPC to bypass RLS
   */
  const removeItemInstancesByIds = async (ids: string[]) => {
    if (!accountId || ids.length === 0) {
      console.log('⚠️ [removeItemInstancesByIds] Skipped - no accountId or empty ids array', { accountId, idsLength: ids.length });
      return;
    }

    console.log('🚀 [removeItemInstancesByIds] Starting removal of', ids.length, 'instances for wallet:', accountId);
    console.log('🚀 [removeItemInstancesByIds] IDs to remove:', ids);

    try {
      // Use RPC to bypass RLS (similar to add_item_instances)
      const { data, error } = await supabase.rpc('remove_item_instances', {
        p_wallet_address: accountId,
        p_instance_ids: ids
      });

      if (error) {
        console.error('❌ [removeItemInstancesByIds] Supabase RPC error:', error);
        throw error;
      }
      
      console.log('✅ [removeItemInstancesByIds] Successfully removed', data, 'item instances from DB via RPC');
      
      // Сразу обновляем локальное состояние для быстрого отклика UI
      setInstances(prev => prev.filter(inst => !ids.includes(inst.id)));
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
    refetch: fetchInstances
  };
};
