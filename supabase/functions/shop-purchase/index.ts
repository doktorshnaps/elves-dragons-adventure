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

    // Получаем текущее количество товара
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

    console.log(`✅ Purchase successful: item ${item_id}, remaining: ${inventoryItem.available_quantity - 1}`);

    return new Response(JSON.stringify({ 
      success: true,
      remaining_quantity: inventoryItem.available_quantity - 1
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