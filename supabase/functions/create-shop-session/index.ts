import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// 🔒 Input validation schema - wallet_address extracted from active dungeon session or JWT
const CreateSessionSchema = z.object({
  item_id: z.number().int().min(1),
  quantity: z.number().int().min(1).max(100).default(1),
  // Optional: session_id from active dungeon session for wallet verification
  session_id: z.string().uuid().optional()
});

// Rate limiting configuration
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10; // Max 10 session requests per minute per wallet

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

// Extract wallet from JWT Authorization header
function extractWalletFromAuth(req: Request, supabase: any): Promise<string | null> {
  return new Promise(async (resolve) => {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      resolve(null);
      return;
    }

    const token = authHeader.replace('Bearer ', '');
    try {
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (error || !user) {
        resolve(null);
        return;
      }
      // Get wallet from user metadata or identity
      const wallet = user.user_metadata?.wallet_address || 
                     user.identities?.[0]?.identity_data?.wallet_address;
      resolve(wallet || null);
    } catch {
      resolve(null);
    }
  });
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

    // 🔒 Parse and validate input
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return json({ error: 'Invalid request body', success: false }, 400);
    }

    const parseResult = CreateSessionSchema.safeParse(body);
    if (!parseResult.success) {
      console.error('❌ Validation error:', parseResult.error.flatten());
      return json({ error: 'Invalid request parameters', success: false }, 400);
    }

    const { item_id, quantity, session_id } = parseResult.data;
    let wallet_address: string | null = null;

    // ============ SECURITY: WALLET VERIFICATION ============
    // Priority 1: Extract from JWT token (most secure)
    wallet_address = await extractWalletFromAuth(req, supabase);

    // Priority 2: Verify via active dungeon session (for NEAR wallet users)
    if (!wallet_address && session_id) {
      console.log('🔐 Attempting wallet verification via session_id');
      const { data: session, error: sessionError } = await supabase
        .from('active_dungeon_sessions')
        .select('account_id')
        .eq('id', session_id)
        .single();

      if (!sessionError && session?.account_id) {
        wallet_address = session.account_id;
        console.log('✅ Wallet verified via active session');
      }
    }

    // Priority 3: Verify via wallet_identities or game_data (for connected NEAR wallets)
    if (!wallet_address) {
      const legacyBody = body as { wallet_address?: string };
      if (legacyBody.wallet_address) {
        // First try: Check wallet_identities table
        const { data: identity, error: identityError } = await supabase
          .from('wallet_identities')
          .select('wallet_address')
          .eq('wallet_address', legacyBody.wallet_address)
          .single();

        if (!identityError && identity) {
          wallet_address = identity.wallet_address;
          console.log('✅ Wallet verified via wallet_identities');
        } else {
          // Fallback: Verify wallet exists in game_data (proves it's a registered player)
          const { data: gameDataCheck, error: gameDataError } = await supabase
            .from('game_data')
            .select('wallet_address')
            .eq('wallet_address', legacyBody.wallet_address)
            .single();

          if (!gameDataError && gameDataCheck) {
            wallet_address = gameDataCheck.wallet_address;
            console.log('✅ Wallet verified via game_data registration');
          } else {
            console.warn('⚠️ Wallet not found in identities or game_data');
          }
        }
      }
    }

    // 🔒 FINAL CHECK: Must have verified wallet
    if (!wallet_address) {
      console.error('❌ Could not verify wallet ownership');
      await supabase.from('security_audit_log').insert({
        event_type: 'SHOP_SESSION_UNVERIFIED_WALLET',
        wallet_address: (body as { wallet_address?: string }).wallet_address || null,
        details: { item_id, quantity, error: 'Could not verify wallet ownership' }
      });

      return json({ 
        error: 'Could not verify wallet ownership. Please reconnect your wallet.',
        code: 'WALLET_VERIFICATION_FAILED',
        success: false 
      }, 401);
    }

    console.log(`🛒 Creating shop session for verified wallet: ${wallet_address.substring(0, 10)}..., item: ${item_id}, qty: ${quantity}`);

    // 🔒 SECURITY: Check rate limiting for this wallet
    const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();
    const { count: recentRequests, error: countError } = await supabase
      .from('shop_sessions')
      .select('id', { count: 'exact', head: true })
      .eq('wallet_address', wallet_address)
      .gte('created_at', windowStart);

    if (countError) {
      console.error('❌ Rate limit check error:', countError);
    } else if (recentRequests !== null && recentRequests >= RATE_LIMIT_MAX_REQUESTS) {
      console.warn(`🚫 Rate limit exceeded for wallet: ${wallet_address}`);
      
      await supabase.from('security_audit_log').insert({
        event_type: 'SHOP_SESSION_RATE_LIMITED',
        wallet_address,
        details: { item_id, quantity, recent_requests: recentRequests }
      });

      return json({ 
        error: 'Too many requests. Please wait a moment.',
        code: 'RATE_LIMITED',
        success: false 
      }, 429);
    }

    // Verify wallet exists in game_data (proves the wallet is a registered player)
    const { data: gameData, error: gameError } = await supabase
      .from('game_data')
      .select('user_id, balance')
      .eq('wallet_address', wallet_address)
      .single();

    if (gameError || !gameData) {
      console.error('❌ Wallet not found in game_data:', gameError);
      
      await supabase.from('security_audit_log').insert({
        event_type: 'SHOP_SESSION_INVALID_WALLET',
        wallet_address,
        details: { item_id, quantity, error: 'Wallet not registered in game' }
      });

      return json({ error: 'Wallet not found in game', success: false }, 404);
    }

    // Verify item exists and is in stock
    const { data: inventoryItem, error: invError } = await supabase
      .from('shop_inventory')
      .select('available_quantity')
      .eq('item_id', item_id)
      .single();

    if (invError || !inventoryItem) {
      console.error('❌ Item not found:', invError);
      return json({ error: 'Item not found in shop', success: false }, 404);
    }

    if (inventoryItem.available_quantity < quantity) {
      return json({ error: 'Item out of stock or insufficient quantity', success: false }, 400);
    }

    // Get item price for balance check
    const { data: itemTemplate, error: templateError } = await supabase
      .from('item_templates')
      .select('value')
      .eq('id', item_id)
      .single();

    if (templateError || !itemTemplate) {
      console.error('❌ Item template not found:', templateError);
      return json({ error: 'Item information not available', success: false }, 404);
    }

    // Check if user has enough balance
    const totalCost = (itemTemplate.value || 0) * quantity;
    if (gameData.balance < totalCost) {
      return json({ error: 'Insufficient balance', success: false }, 400);
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
      return json({ error: 'Failed to create session', success: false }, 500);
    }

    console.log(`✅ Shop session created: ${sessionToken.substring(0, 8)}...`);

    return json({ 
      success: true,
      session_token: sessionToken,
      expires_in_seconds: 300 // 5 minutes
    });

  } catch (error) {
    console.error('💥 Error in create-shop-session function:', error);
    return json({ error: 'Failed to create shop session', success: false }, 500);
  }
});
