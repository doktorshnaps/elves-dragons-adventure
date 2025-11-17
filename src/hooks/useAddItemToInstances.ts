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

    // If same payload within short window or while in-flight, skip
    const now = Date.now();
    if (isAddingNow && lastPayloadHash === payloadHash) {
      console.warn('⏭️ Skipping duplicate addItemsToInstances call (in-flight with same payload)');
      return;
    }
    if (lastPayloadHash === payloadHash && now - lastCallAt < 2000) {
      console.warn('⏭️ Skipping duplicate addItemsToInstances call (same payload within 2s)');
      return;
    }

    try {
      isAddingNow = true;
      lastPayloadHash = payloadHash;
      lastCallAt = now;

      console.log('📝 Adding items to item_instances via RPC:', itemsJson);
      console.log('📦 Calling add_item_instances RPC with:', { 
        wallet: accountId, 
        items: itemsJson 
      });

      // Use RPC to bypass RLS
      const { data, error } = await supabase.rpc('add_item_instances', {
        p_wallet_address: accountId,
        p_items: itemsJson
      });

      if (error) throw error;
      console.log(`✅ Added ${data} items to item_instances via RPC`);
    } catch (e) {
      console.error('❌ Failed to add items to item_instances:', e);
    } finally {
      isAddingNow = false;
    }
  };

  return { addItemsToInstances };
};
