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

    const { item_id, wallet_address } = await req.json();

    if (!item_id || !wallet_address) {
      return new Response(JSON.stringify({ 
        error: 'Missing item_id or wallet_address' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`🛒 Processing purchase: item ${item_id} for wallet ${wallet_address}`);

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

    if (!inventoryItem || inventoryItem.available_quantity <= 0) {
      return new Response(JSON.stringify({ 
        error: 'Item out of stock',
        success: false 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Получаем шаблон предмета
    const { data: itemTemplate, error: templateError } = await supabase
      .from('item_templates')
      .select('*')
      .eq('id', item_id)
      .single();

    if (templateError) {
      console.error('❌ Error fetching item template:', templateError);
      throw templateError;
    }

    // Уменьшаем количество товара на 1
    const { error: updateError } = await supabase
      .from('shop_inventory')
      .update({ 
        available_quantity: inventoryItem.available_quantity - 1,
        updated_at: new Date().toISOString()
      })
      .eq('item_id', item_id);

    if (updateError) {
      console.error('❌ Error updating inventory:', updateError);
      throw updateError;
    }

    // Если это рабочий - создаем card_instance, иначе добавляем в inventory через atomic_inventory_update
    if (itemTemplate.type === 'worker') {
      // Проверяем, есть ли уже такой рабочий у пользователя
      const { data: existingWorker, error: checkError } = await supabase
        .from('card_instances')
        .select('*')
        .eq('wallet_address', wallet_address)
        .eq('card_type', 'workers')
        .like('card_data->name', itemTemplate.name)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('❌ Error checking existing worker:', checkError);
        throw checkError;
      }

      if (existingWorker) {
        console.log(`⚠️ Worker ${itemTemplate.name} already exists for wallet ${wallet_address}, skipping creation`);
        return new Response(JSON.stringify({ 
          success: true,
          remaining_quantity: inventoryItem.available_quantity - 1,
          item_type: itemTemplate.type,
          message: 'Worker already exists'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const cardData = {
        id: `worker_${item_id}`, // Убираем timestamp для предотвращения дублирования
        name: itemTemplate.name,
        description: itemTemplate.description,
        type: 'worker',
        rarity: itemTemplate.rarity || 'common',
        health: 100, // У рабочих базовое здоровье
        value: itemTemplate.value,
        stats: itemTemplate.stats,
        image: itemTemplate.image_url
      };

      // Создаем card_instance для рабочего
      const { data: cardInstanceId, error: cardError } = await supabase
        .from('card_instances')
        .insert({
          wallet_address: wallet_address,
          card_template_id: cardData.id,
          card_type: 'workers',
          current_health: cardData.health,
          max_health: cardData.health,
          card_data: cardData
        })
        .select('id')
        .single();

      if (cardError) {
        console.error('❌ Error creating card instance:', cardError);
        throw cardError;
      }

      console.log(`✅ Worker card instance created: ${cardData.id}`);
    } else {
      // Для обычных предметов используем старую логику через atomic_inventory_update
      const itemData = {
        id: `item_${item_id}_${Date.now()}`,
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
        p_price_deduction: 0, // Цена уже списана в shop
        p_new_item: itemData
      });

      if (inventoryError) {
        console.error('❌ Error adding item to inventory:', inventoryError);
        throw inventoryError;
      }
    }

    console.log(`✅ Purchase successful: item ${item_id}, remaining: ${inventoryItem.available_quantity - 1}`);

    return new Response(JSON.stringify({ 
      success: true,
      remaining_quantity: inventoryItem.available_quantity - 1,
      item_type: itemTemplate.type
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