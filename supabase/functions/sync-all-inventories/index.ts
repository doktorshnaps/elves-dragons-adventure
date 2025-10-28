import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SyncResult {
  wallet_address: string;
  inventory_count: number;
  instances_before: number;
  removed: number;
  added: number;
  error?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('🔄 Starting mass inventory synchronization...');

    // 1. Get all players with game_data
    const { data: allPlayers, error: playersError } = await supabase
      .from('game_data')
      .select('wallet_address, inventory');

    if (playersError) throw playersError;

    console.log(`📊 Found ${allPlayers?.length || 0} players to sync`);

    const results: SyncResult[] = [];

    // 2. Load all item templates once
    const { data: templates } = await supabase
      .from('item_templates')
      .select('*');

    const templateMap = new Map<string, any>();
    (templates || []).forEach(tpl => {
      templateMap.set(tpl.name, tpl);
      templateMap.set(tpl.item_id, tpl);
    });

    // 3. Process each player
    for (const player of allPlayers || []) {
      const wallet = player.wallet_address;
      
      try {
        console.log(`🔄 Syncing wallet: ${wallet}`);
        
        const inventoryJson = (player.inventory || []) as any[];
        
        // Get current item instances
        const { data: instances, error: instancesError } = await supabase
          .rpc('get_item_instances_by_wallet', { p_wallet_address: wallet });

        if (instancesError) throw instancesError;

        const itemInstances = (instances || []) as any[];
        const instancesBefore = itemInstances.length;

        // Count inventory items by item_id
        const inventoryByItemId = new Map<string, number>();
        for (const item of inventoryJson) {
          const tpl = templateMap.get(item.name);
          const key = tpl?.item_id || item.name;
          inventoryByItemId.set(key, (inventoryByItemId.get(key) || 0) + 1);
        }

        // Count instances by item_id
        const instancesByItemId = new Map<string, string[]>();
        for (const inst of itemInstances) {
          const key = inst.item_id || inst.name || 'unknown';
          if (!instancesByItemId.has(key)) {
            instancesByItemId.set(key, []);
          }
          instancesByItemId.get(key)!.push(inst.id);
        }

        // Determine which instances to remove (excess)
        const idsToRemove: string[] = [];
        for (const [itemId, instanceIds] of instancesByItemId.entries()) {
          const shouldHave = inventoryByItemId.get(itemId) || 0;
          const actuallyHave = instanceIds.length;
          
          if (actuallyHave > shouldHave) {
            const excess = actuallyHave - shouldHave;
            idsToRemove.push(...instanceIds.slice(0, excess));
          }
        }

        // Determine which instances to add (missing)
        const itemsToAdd: any[] = [];
        for (const [itemId, count] of inventoryByItemId.entries()) {
          const instanceIds = instancesByItemId.get(itemId) || [];
          if (instanceIds.length < count) {
            const missing = count - instanceIds.length;
            
            const tpl = templateMap.get(itemId);
            for (let i = 0; i < missing; i++) {
              itemsToAdd.push({
                item_id: itemId,
                template_id: tpl?.id,
                name: tpl?.name,
                type: tpl?.type || 'material'
              });
            }
          }
        }

        let removed = 0;
        let added = 0;

        // Remove excess instances
        if (idsToRemove.length > 0) {
          const { data: removedData, error: removeError } = await supabase.rpc('remove_item_instances', {
            p_wallet_address: wallet,
            p_instance_ids: idsToRemove
          });

          if (removeError) throw removeError;
          removed = removedData || 0;
        }

        // Add missing instances
        if (itemsToAdd.length > 0) {
          const { data: addedData, error: addError } = await supabase.rpc('add_item_instances', {
            p_wallet_address: wallet,
            p_items: itemsToAdd
          });

          if (addError) throw addError;
          added = addedData || 0;
        }

        results.push({
          wallet_address: wallet,
          inventory_count: inventoryJson.length,
          instances_before: instancesBefore,
          removed,
          added
        });

        console.log(`✅ Synced ${wallet}: removed=${removed}, added=${added}`);
      } catch (error: any) {
        console.error(`❌ Error syncing ${wallet}:`, error);
        results.push({
          wallet_address: wallet,
          inventory_count: 0,
          instances_before: 0,
          removed: 0,
          added: 0,
          error: error.message
        });
      }
    }

    console.log('✅ Mass synchronization complete');

    return new Response(
      JSON.stringify({
        success: true,
        total_players: allPlayers?.length || 0,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('❌ Mass sync error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
