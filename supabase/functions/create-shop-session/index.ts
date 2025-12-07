import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// 🔒 Input validation schema
const CreateSessionSchema = z.object({
  wallet_address: z.string().min(1).max(100),
  item_id: z.number().int().min(1),
  quantity: z.number().int().min(1).max(100).default(1)
});

// Rate limiting configuration
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10; // Max 10 session requests per minute per wallet

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 🔒 Parse and validate input
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ 
        error: 'Invalid request body',
        success: false 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const parseResult = CreateSessionSchema.safeParse(body);
    if (!parseResult.success) {
      console.error('❌ Validation error:', parseResult.error.flatten());
      return new Response(JSON.stringify({ 
        error: 'Invalid request parameters',
        success: false 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { wallet_address, item_id, quantity } = parseResult.data;

    console.log(`🛒 Creating shop session for wallet: ${wallet_address}, item: ${item_id}, qty: ${quantity}`);

    // 🔒 SECURITY: Check rate limiting for this wallet
    const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();
    const { count: recentRequests, error: countError } = await supabase
      .from('shop_sessions')
      .select('id', { count: 'exact', head: true })
      .eq('wallet_address', wallet_address)
      .gte('created_at', windowStart);

    if (countError) {
      console.error('❌ Rate limit check error:', countError);
      // Continue without rate limiting if check fails
    } else if (recentRequests !== null && recentRequests >= RATE_LIMIT_MAX_REQUESTS) {
      console.warn(`🚫 Rate limit exceeded for wallet: ${wallet_address}`);
      
      // Log security event
      await supabase.from('security_audit_log').insert({
        event_type: 'SHOP_SESSION_RATE_LIMITED',
        wallet_address,
        details: { item_id, quantity, recent_requests: recentRequests }
      });

      return new Response(JSON.stringify({ 
        error: 'Too many requests. Please wait a moment.',
        code: 'RATE_LIMITED',
        success: false 
      }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify wallet exists in game_data (proves the wallet is a registered player)
    const { data: gameData, error: gameError } = await supabase
      .from('game_data')
      .select('user_id, balance')
      .eq('wallet_address', wallet_address)
      .single();

    if (gameError || !gameData) {
      console.error('❌ Wallet not found:', gameError);
      
      // 🔒 Log suspicious attempt to create session for non-existent wallet
      await supabase.from('security_audit_log').insert({
        event_type: 'SHOP_SESSION_INVALID_WALLET',
        wallet_address,
        details: { item_id, quantity, error: 'Wallet not registered' }
      });

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
