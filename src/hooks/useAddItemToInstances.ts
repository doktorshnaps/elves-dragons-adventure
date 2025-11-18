import { supabase } from '@/integrations/supabase/client';
import { useWalletContext } from '@/contexts/WalletConnectContext';
import { useItemTemplates } from '@/hooks/useItemTemplates';

// Simple idempotency guards (module-scoped)
let isAddingNow = false;
let lastPayloadHash: string | null = null;
let lastCallAt = 0;

/**
 * Hook for adding items to item_instances table in a unified way
 */
export const useAddItemToInstances = () => {
  const { accountId } = useWalletContext();
  const { getTemplateByName, loading } = useItemTemplates();

  /**
   * Add items to item_instances table using RPC to bypass RLS
   * @param items - Array of items to add (can have name, type, or template info)
   */
  const addItemsToInstances = async (items: Array<{ name?: string; type?: string; template_id?: number; item_id?: string }>) => {
    if (!accountId || items.length === 0) {
      console.log('⚠️ Cannot add items to instances: no accountId or empty items array');
      return;
    }

    if (loading) {
      console.log('⚠️ Item templates are still loading, waiting...');
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    // Prepare items array for RPC call
    const itemsJson = items.map(it => ({
      name: it.name ?? null,
      type: it.type ?? 'material',
      template_id: it.template_id ? String(it.template_id) : null,
      item_id: it.item_id ?? null
    }));

    // Idempotency: collapse duplicates in payload
    const collapsed = itemsJson.map(i => JSON.stringify(i)).sort();
    const payloadHash = collapsed.join('|');

    const IDEMP_TTL_MS = 5000;
    const now = Date.now();
    const storageKey = `add_items:${accountId}:${payloadHash}`;

    // If same payload while in-flight, skip
    if (isAddingNow && lastPayloadHash === payloadHash) {
      console.warn('⏭️ ADD_ITEMS SKIP (in-flight same payload)', { payloadHash });
      return;
    }

    // In-memory short window
    if (lastPayloadHash === payloadHash && now - lastCallAt < IDEMP_TTL_MS) {
      console.warn('⏭️ ADD_ITEMS SKIP (memory TTL)', { ttl: IDEMP_TTL_MS, payloadHash });
      return;
    }

    // Cross-instance/session guard using storage
    try {
      if (typeof window !== 'undefined') {
        const tsRaw = sessionStorage.getItem(storageKey) || localStorage.getItem(storageKey);
        const ts = tsRaw ? parseInt(tsRaw) : 0;
        if (ts && now - ts < IDEMP_TTL_MS) {
          console.warn('⏭️ ADD_ITEMS SKIP (storage TTL)', { ttl: IDEMP_TTL_MS, payloadHash });
          return;
        }
      }
    } catch (e) {
      console.debug('ℹ️ Storage not available for idempotency, continuing');
    }

    try {
      isAddingNow = true;
      lastPayloadHash = payloadHash;
      lastCallAt = now;

      // Preemptively set storage guard to block concurrent duplicate calls
      try {
        if (typeof window !== 'undefined') {
          sessionStorage.setItem(storageKey, String(now));
        }
      } catch {}

      console.log('📝 ADD_ITEMS START', { count: itemsJson.length, payloadHash });
      console.log('📦 Calling add_item_instances RPC with:', { wallet: accountId, items: itemsJson });

      // Use RPC to bypass RLS
      const { data, error } = await supabase.rpc('add_item_instances', {
        p_wallet_address: accountId,
        p_items: itemsJson
      });

      if (error) throw error;

      // Persist success timestamp
      try {
        if (typeof window !== 'undefined') {
          localStorage.setItem(storageKey, String(Date.now()));
        }
      } catch {}

      console.log(`✅ ADD_ITEMS DONE: added ${data} items`);
    } catch (e) {
      console.error('❌ Failed to add items to item_instances:', e);
    } finally {
      isAddingNow = false;
    }
  };

  return { addItemsToInstances };
};
