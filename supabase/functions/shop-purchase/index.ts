import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

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

    // Parse request body - now we only accept session_token
    const { session_token } = await req.json();

    // Validate session_token
    if (!session_token) {
      console.error('❌ Missing session_token');
      return new Response(JSON.stringify({ 
        error: 'Missing session_token. Create a session first.',
        code: 'SESSION_REQUIRED',
        success: false 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`🔐 Validating shop session: ${session_token.substring(0, 8)}...`);

    // Validate session and get wallet_address, item_id, quantity from database
    const { data: sessionData, error: sessionError } = await supabase
      .rpc('validate_shop_session', { p_session_token: session_token });

    if (sessionError) {
      console.error('❌ Session validation error:', sessionError);
      return new Response(JSON.stringify({ 
        error: 'Session validation failed',
        code: 'SESSION_ERROR',
        success: false 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if session is valid
    const session = sessionData?.[0];
    if (!session || !session.is_valid) {
      console.error('❌ Invalid session:', session?.error_message || 'Unknown error');
      return new Response(JSON.stringify({ 
        error: session?.error_message || 'Invalid session',
        code: 'INVALID_SESSION',
        success: false 
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Extract verified data from session
    const wallet_address = session.wallet_address;
    const item_id = session.item_id;
    const quantity = session.quantity;

    console.log(`✅ Session validated for wallet: ${wallet_address}, item: ${item_id}, qty: ${quantity}`);

    // Rest of purchase logic with verified wallet_address from database
    console.log(`🛒 Processing purchase: item ${item_id} (qty: ${quantity})`);

    // Получаем информацию о товаре
    const { data: inventoryItem, error: fetchError } = await supabase
      .from('shop_inventory')
      .select('*')
      .eq('item_id', item_id)
      .single();

    if (fetchError) {
      console.error('❌ Error fetching inventory item:', fetchError);
      return new Response(JSON.stringify({ 
        error: 'Unable to fetch item information',
        code: 'FETCH_ERROR',
        success: false 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
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
      return new Response(JSON.stringify({ 
        error: 'Item information not available',
        code: 'TEMPLATE_ERROR',
        success: false 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`📋 Found item template: ${itemTemplate.name}`);

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
      return new Response(JSON.stringify({ 
        error: 'Unable to update inventory',
        code: 'UPDATE_ERROR',
        success: false 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
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
    
// Рабочие теперь добавляем как card_instances
if (itemTemplate.type === 'worker') {
  console.log(`👷 Processing ${quantity} workers: ${itemTemplate.name} (item_id: ${itemTemplate.item_id})`);
  
  // Получаем user_id для создания card_instances
  const { data: userData, error: userError } = await supabase
    .from('game_data')
    .select('user_id')
    .eq('wallet_address', wallet_address)
    .single();
  
  if (userError || !userData) {
    console.error('❌ Error fetching user data:', userError);
    throw new Error('User not found');
  }
  
  console.log(`👷 User data found:`, JSON.stringify(userData, null, 2));
  
  // Для каждого рабочего создаем отдельную запись в card_instances
  for (let i = 0; i < quantity; i++) {
    const workerInstanceId = `worker_${item_id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${i}`;
    
    const cardData = {
      id: workerInstanceId,
      name: itemTemplate.name,
      description: itemTemplate.description,
      type: 'worker',
      rarity: itemTemplate.rarity || 'common',
      value: itemTemplate.value,
      sell_price: itemTemplate.sell_price,
      stats: itemTemplate.stats || {},
      image: itemTemplate.image_url,
      templateId: itemTemplate.item_id
    };

    console.log(`👷 Creating worker ${i+1}/${quantity} with:`, {
      workerInstanceId,
      cardData,
      insertPayload: {
        user_id: userData.user_id,
        wallet_address,
        card_template_id: workerInstanceId,
        card_type: 'workers'
      }
    });

    const { data: insertedCard, error: cardInstanceError } = await supabase
      .from('card_instances')
      .insert({
        user_id: userData.user_id,
        wallet_address: wallet_address,
        card_template_id: workerInstanceId,
        card_type: 'workers',
        current_health: 100,
        max_health: 100,
        current_defense: 0,
        max_defense: 0,
        card_data: cardData,
        last_heal_time: new Date().toISOString(),
        is_in_medical_bay: false,
        monster_kills: 0
      })
      .select();

    if (cardInstanceError) {
      console.error(`❌ Error creating card instance for worker ${i+1}/${quantity}:`, cardInstanceError);
      throw cardInstanceError;
    }
    
    console.log(`✅ Created card instance ${i+1}/${quantity}:`, insertedCard);
  }

  console.log(`✅ Created ${quantity} worker card instances`);
    } else {
      console.log(`📦 Processing as regular item: ${itemTemplate.name}`);
      
      // Для обычных предметов добавляем в item_instances (новая система)
      const itemRows = [];
      for (let i = 0; i < quantity; i++) {
        itemRows.push({
          wallet_address: wallet_address,
          template_id: itemTemplate.id,
          item_id: itemTemplate.item_id,
          name: itemTemplate.name,
          type: itemTemplate.type
        });
      }

      const { data: insertedItems, error: instancesError } = await supabase
        .from('item_instances')
        .insert(itemRows)
        .select('id');

      if (instancesError) {
        console.error(`❌ Error adding items to item_instances:`, instancesError);
        throw instancesError;
      }

      console.log(`✅ Added ${quantity} items to item_instances:`, insertedItems);
    }

    console.log(`✅ Purchase successful: item ${item_id}, remaining: ${inventoryItem.available_quantity - quantity}`);

    return new Response(JSON.stringify({ 
      success: true,
      remaining_quantity: inventoryItem.available_quantity - quantity,
      item_type: itemTemplate.type,
      quantity_purchased: quantity,
      item_name: itemTemplate.name
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('💥 Error in shop-purchase function:', error);
    return new Response(JSON.stringify({ 
      error: 'Purchase failed',
      code: 'PURCHASE_ERROR',
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
