import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ 
        error: 'Missing authorization header',
        success: false 
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create client with user's JWT to get their wallet
    const userSupabase = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    });

    // Get user's wallet address from their profile/game_data
    const { data: userData, error: userError } = await userSupabase
      .from('game_data')
      .select('wallet_address')
      .limit(1)
      .single();

    if (userError || !userData) {
      return new Response(JSON.stringify({ 
        error: 'Failed to get user wallet address',
        success: false 
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const wallet_address = userData.wallet_address;

    const { item_id, quantity = 1 } = await req.json();

    // Validate item_id
    if (!item_id) {
      return new Response(JSON.stringify({ 
        error: 'Missing item_id',
        success: false 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate quantity - must be positive integer between 1 and 100
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100) {
      return new Response(JSON.stringify({ 
        error: 'Invalid quantity: must be integer between 1 and 100',
        success: false 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`🛒 Processing purchase: item ${item_id} (qty: ${quantity}) for wallet ${wallet_address}`);

    // Получаем информацию о товаре
    const { data: inventoryItem, error: fetchError } = await supabase
      .from('shop_inventory')
      .select('*')
      .eq('item_id', item_id)
      .single();

    if (fetchError) {
      console.error('❌ Error fetching inventory item:', fetchError);
      throw fetchError;
    }

    if (!inventoryItem || inventoryItem.available_quantity < quantity) {
      return new Response(JSON.stringify({ 
        error: 'Item out of stock or insufficient quantity',
        success: false 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Пытаемся получить шаблон по числовому id (совпадает с shop_inventory.item_id)
    let itemTemplate: any = null;
    let templateError: any = null;

    const byNumeric = await supabase
      .from('item_templates')
      .select('*')
      .eq('id', item_id)
      .maybeSingle();

    if (byNumeric.error) templateError = byNumeric.error;
    itemTemplate = byNumeric.data;

    // Если не нашли (на случай старых данных) — пробуем по текстовому item_id для рабочих
    if (!itemTemplate) {
      const byWorkerKey = await supabase
        .from('item_templates')
        .select('*')
        .eq('item_id', `worker_${item_id}`)
        .maybeSingle();
      if (byWorkerKey.error && !templateError) templateError = byWorkerKey.error;
      itemTemplate = byWorkerKey.data;
    }

    if (!itemTemplate) {
      console.error('❌ Error fetching item template:', templateError);
      throw new Error('Item template not found');
    }

    console.log(`📋 Found item template:`, itemTemplate);

    // Уменьшаем количество товара на quantity
    const { error: updateError } = await supabase
      .from('shop_inventory')
      .update({ 
        available_quantity: inventoryItem.available_quantity - quantity,
        updated_at: new Date().toISOString()
      })
      .eq('item_id', item_id);

    if (updateError) {
      console.error('❌ Error updating inventory:', updateError);
      throw updateError;
    }

    console.log(`🔍 Checking item type: "${itemTemplate.type}" for item: ${itemTemplate.name}`);
    
    // Сначала списываем деньги с баланса пользователя
    const totalCost = itemTemplate.value * quantity;
    const { error: balanceError } = await supabase.rpc('atomic_balance_update', {
      p_wallet_address: wallet_address,
      p_price_deduction: totalCost
    });

    if (balanceError) {
      console.error('❌ Error deducting balance:', balanceError);
      // Откатываем изменения в инвентаре
      await supabase
        .from('shop_inventory')
        .update({ 
          available_quantity: inventoryItem.available_quantity,
          updated_at: new Date().toISOString()
        })
        .eq('item_id', item_id);
      throw balanceError;
    }

    console.log(`💰 Successfully deducted ${totalCost} ELL from balance`);
    
// Рабочие теперь добавляем напрямую в inventory (не в card_instances)
if (itemTemplate.type === 'worker') {
  console.log(`👷 Processing ${quantity} workers: ${itemTemplate.name} (item_id: ${itemTemplate.item_id})`);
  
  // Для рабочих добавляем в инвентарь через atomic_inventory_update
  for (let i = 0; i < quantity; i++) {
    const workerData = {
      id: `worker_${item_id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${i}`,
      instanceId: `worker_${item_id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${i}`,
      templateId: `worker_${item_id}`,
      name: itemTemplate.name,
      description: itemTemplate.description,
      type: 'worker',
      rarity: itemTemplate.rarity || 'common',
      value: itemTemplate.value,
      stats: itemTemplate.stats || {},
      image: itemTemplate.image_url
    };

    const { error: inventoryError } = await supabase.rpc('atomic_inventory_update', {
      p_wallet_address: wallet_address,
      p_price_deduction: 0, // Цена уже списана выше
      p_new_item: workerData
    });

    if (inventoryError) {
      console.error(`❌ Error adding worker ${i+1}/${quantity} to inventory:`, inventoryError);
      throw inventoryError;
    }
  }

  console.log(`✅ Added ${quantity} workers to inventory`);
    } else {
      console.log(`📦 Processing as regular item: ${itemTemplate.name}`);
      
      // Для обычных предметов добавляем в инвентарь без списания баланса (уже списан выше)
      for (let i = 0; i < quantity; i++) {
        const itemData = {
          id: `item_${item_id}_${Date.now()}_${i}`,
          name: itemTemplate.name,
          description: itemTemplate.description,
          type: itemTemplate.type,
          rarity: itemTemplate.rarity || 'common',
          value: itemTemplate.value,
          stats: itemTemplate.stats,
          image: itemTemplate.image_url
        };

        const { error: inventoryError } = await supabase.rpc('atomic_inventory_update', {
          p_wallet_address: wallet_address,
          p_price_deduction: 0, // Цена уже списана выше
          p_new_item: itemData
        });

        if (inventoryError) {
          console.error(`❌ Error adding item ${i+1}/${quantity} to inventory:`, inventoryError);
          throw inventoryError;
        }
      }
    }

    console.log(`✅ Purchase successful: item ${item_id}, remaining: ${inventoryItem.available_quantity - quantity}`);

    return new Response(JSON.stringify({ 
      success: true,
      remaining_quantity: inventoryItem.available_quantity - quantity,
      item_type: itemTemplate.type,
      quantity_purchased: quantity
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('💥 Error in shop-purchase function:', error);
    return new Response(JSON.stringify({ 
      error: (error as any)?.message || 'Unknown error',
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});