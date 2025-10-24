import { useState, useEffect } from 'react';
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

  useEffect(() => {
    if (!accountId) {
      setInstances([]);
      setLoading(false);
      return;
    }

    const fetchInstances = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('item_instances')
          .select('*')
          .eq('wallet_address', accountId);

        if (error) throw error;
        setInstances((data as ItemInstance[]) || []);
      } catch (e) {
        console.error('❌ Failed to fetch item_instances:', e);
        setInstances([]);
      } finally {
        setLoading(false);
      }
    };

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
   * Remove N item instances by their UUIDs
   */
  const removeItemInstancesByIds = async (ids: string[]) => {
    if (!accountId || ids.length === 0) return;

    try {
      const { error } = await supabase
        .from('item_instances')
        .delete()
        .in('id', ids);

      if (error) throw error;
      console.log('✅ Removed', ids.length, 'item instances from DB');
    } catch (e) {
      console.error('❌ Failed to remove item_instances:', e);
    }
  };

  /**
   * Group instances by item_id, returning counts
   */
  const getCountsByItemId = (): Record<string, number> => {
    const counts: Record<string, number> = {};
    instances.forEach(inst => {
      const key = inst.item_id || inst.name || 'unknown';
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  };

  /**
   * Get all instances matching a given item_id
   */
  const getInstancesByItemId = (itemId: string): ItemInstance[] => {
    return instances.filter(inst => inst.item_id === itemId);
  };

  return {
    instances,
    loading,
    addItemInstances,
    removeItemInstancesByIds,
    getCountsByItemId,
    getInstancesByItemId
  };
};
