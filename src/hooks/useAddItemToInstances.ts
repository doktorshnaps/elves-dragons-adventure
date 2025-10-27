import { supabase } from '@/integrations/supabase/client';
import { useWalletContext } from '@/contexts/WalletConnectContext';
import { useItemTemplates } from '@/hooks/useItemTemplates';

/**
 * Hook for adding items to item_instances table in a unified way
 */
export const useAddItemToInstances = () => {
  const { accountId } = useWalletContext();
  const { getTemplateByName, loading } = useItemTemplates();

  /**
   * Add items to item_instances table
   * @param items - Array of items to add (can have name, type, or template info)
   */
  const addItemsToInstances = async (items: Array<{ name?: string; type?: string; template_id?: number; item_id?: string }>) => {
    if (!accountId || items.length === 0) {
      console.log('⚠️ Cannot add items to instances: no accountId or empty items array');
      return;
    }

    if (loading) {
      console.log('⚠️ Item templates are still loading, waiting...');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    try {
      console.log('📝 Adding items to item_instances:', items);
      
      const rows = items.map(it => {
        let template_id: number | null = it.template_id ?? null;
        let item_id: string | null = it.item_id ?? null;
        let name: string | null = it.name ?? null;
        let type: string | null = it.type ?? 'material';

        // If we have a name but no template info, try to find the template
        if (name && !template_id && !item_id) {
          const tpl = getTemplateByName(name);
          if (tpl) {
            template_id = tpl.id;
            item_id = tpl.item_id;
            type = tpl.type;
            console.log(`✅ Found template for "${name}": id=${template_id}, item_id=${item_id}`);
          } else {
            console.warn(`⚠️ Template not found for item: "${name}"`);
          }
        }

        return {
          wallet_address: accountId,
          template_id,
          item_id,
          name,
          type
        };
      });

      console.log('📦 Inserting rows into item_instances:', rows);

      const { error } = await supabase
        .from('item_instances')
        .insert(rows);

      if (error) throw error;
      console.log('✅ Added', items.length, 'items to item_instances');
    } catch (e) {
      console.error('❌ Failed to add items to item_instances:', e);
    }
  };

  return { addItemsToInstances };
};
