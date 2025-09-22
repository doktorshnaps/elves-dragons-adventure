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

    const { item_id, wallet_address, quantity = 1 } = await req.json();

    if (!item_id || !wallet_address) {
      return new Response(JSON.stringify({ 
        error: 'Missing item_id or wallet_address' 
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
    
    // Если это рабочий - создаем card_instance для каждого экземпляра, иначе добавляем в inventory через atomic_inventory_update  
    if (itemTemplate.type === 'worker') {
      console.log(`👷 Processing ${quantity} workers: ${itemTemplate.name} (item_id: ${itemTemplate.item_id})`);
      
      // Получаем user_id для кошелька
      const { data: gameData, error: gameDataError } = await supabase
        .from('game_data')
        .select('user_id')
        .eq('wallet_address', wallet_address)
        .single();

      if (gameDataError || !gameData?.user_id) {
        console.error('❌ Error getting user_id for wallet:', gameDataError);
        throw new Error('User not found for wallet address');
      }

      // Создаем массив записей для вставки
      const cardInstances = [];
      for (let i = 0; i < quantity; i++) {
        const cardData = {
          id: `worker_${item_id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${i}`,
          name: itemTemplate.name,
          description: itemTemplate.description,
          type: 'worker',
          rarity: itemTemplate.rarity || 'common',
          health: 100, // У рабочих базовое здоровье
          value: itemTemplate.value,
          stats: itemTemplate.stats,
          image: itemTemplate.image_url
        };

        cardInstances.push({
          user_id: gameData.user_id,
          wallet_address: wallet_address,
          card_template_id: itemTemplate.item_id,
          card_type: 'workers',
          current_health: cardData.health,
          max_health: cardData.health,
          card_data: cardData
        });
      }

      // Создаем все card_instances одним запросом
      const { data: cardInstanceIds, error: cardError } = await supabase
        .from('card_instances')
        .insert(cardInstances)
        .select('id');

      if (cardError) {
        console.error('❌ Error creating card instances:', cardError);
        throw cardError;
      }

      console.log(`✅ Created ${quantity} worker card instances: ${cardInstanceIds?.map(c => c.id).join(', ')}`);
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
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});