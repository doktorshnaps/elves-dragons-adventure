import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateSessionRequest {
  wallet_address: string;
  item_id: number;
  quantity?: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { wallet_address, item_id, quantity = 1 }: CreateSessionRequest = await req.json();

    // Validate inputs
    if (!wallet_address || typeof wallet_address !== 'string' || wallet_address.trim().length === 0) {
      return new Response(JSON.stringify({ 
        error: 'Invalid wallet_address',
        success: false 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!item_id || typeof item_id !== 'number' || item_id < 1) {
      return new Response(JSON.stringify({ 
        error: 'Invalid item_id',
        success: false 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100) {
      return new Response(JSON.stringify({ 
        error: 'Invalid quantity: must be integer between 1 and 100',
        success: false 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`🛒 Creating shop session for wallet: ${wallet_address}, item: ${item_id}, qty: ${quantity}`);

    // Verify wallet exists in game_data
    const { data: gameData, error: gameError } = await supabase
      .from('game_data')
      .select('user_id, balance')
      .eq('wallet_address', wallet_address)
      .single();

    if (gameError || !gameData) {
      console.error('❌ Wallet not found:', gameError);
      return new Response(JSON.stringify({ 
        error: 'Wallet not found in game',
        success: false 
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify item exists and is in stock
    const { data: inventoryItem, error: invError } = await supabase
      .from('shop_inventory')
      .select('available_quantity')
      .eq('item_id', item_id)
      .single();

    if (invError || !inventoryItem) {
      console.error('❌ Item not found:', invError);
      return new Response(JSON.stringify({ 
        error: 'Item not found in shop',
        success: false 
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (inventoryItem.available_quantity < quantity) {
      return new Response(JSON.stringify({ 
        error: 'Item out of stock or insufficient quantity',
        success: false 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get item price for balance check
    const { data: itemTemplate, error: templateError } = await supabase
      .from('item_templates')
      .select('value')
      .eq('id', item_id)
      .single();

    if (templateError || !itemTemplate) {
      console.error('❌ Item template not found:', templateError);
      return new Response(JSON.stringify({ 
        error: 'Item information not available',
        success: false 
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if user has enough balance
    const totalCost = itemTemplate.value * quantity;
    if (gameData.balance < totalCost) {
      return new Response(JSON.stringify({ 
        error: 'Insufficient balance',
        success: false 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create session using RPC function
    const { data: sessionToken, error: sessionError } = await supabase
      .rpc('create_shop_session', {
        p_wallet_address: wallet_address,
        p_item_id: item_id,
        p_quantity: quantity
      });

    if (sessionError) {
      console.error('❌ Error creating shop session:', sessionError);
      return new Response(JSON.stringify({ 
        error: 'Failed to create session',
        success: false 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`✅ Shop session created: ${sessionToken.substring(0, 8)}...`);

    return new Response(JSON.stringify({ 
      success: true,
      session_token: sessionToken,
      expires_in_seconds: 300 // 5 minutes
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('💥 Error in create-shop-session function:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to create shop session',
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
