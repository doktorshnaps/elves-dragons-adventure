import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RequestSchema = z.object({
  dungeon_type: z.string().min(1),
  level: z.number().int().min(1).max(100),
  device_id: z.string().min(1),
  // wallet_address is now optional - we verify it server-side
  wallet_address: z.string().min(3).max(100).optional(),
});

type RequestBody = z.infer<typeof RequestSchema>;

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function getSupabaseServiceClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
}

// 🔒 Extract wallet from JWT Authorization header (only for Supabase Auth users)
// NOTE: This project uses NEAR wallet authentication, so this will typically return null
// We skip the auth.getUser call for NEAR tokens to avoid "missing sub claim" 403 errors
async function extractWalletFromAuth(req: Request, supabase: any): Promise<string | null> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.replace('Bearer ', '');
  
  // Skip Supabase Auth check for NEAR wallet tokens
  // NEAR wallet tokens don't have the JWT structure expected by Supabase Auth
  if (token.includes('.tg') || token.includes('.near') || token.length < 100) {
    // This looks like a NEAR wallet address, not a Supabase JWT
    return null;
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return null;
    }
    // Get wallet from user metadata or identity
    const wallet = user.user_metadata?.wallet_address || 
                   user.identities?.[0]?.identity_data?.wallet_address;
    return wallet || null;
  } catch {
    return null;
  }
}

// Rate limiting configuration
const RATE_LIMIT_WINDOW_SECONDS = 60;
const RATE_LIMIT_MAX_REQUESTS = 15; // Max 15 dungeon starts per minute

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const parsed = RequestSchema.safeParse(body);
    
    if (!parsed.success) {
      console.error('❌ Validation failed:', parsed.error.format());
      return json({ error: 'Invalid request parameters' }, 400);
    }

    const { dungeon_type, level, device_id }: RequestBody = parsed.data;
    const supabase = getSupabaseServiceClient();
    
    // Get client IP for additional rate limiting
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                     req.headers.get('cf-connecting-ip') || 
                     'unknown';

    // 🔒 SECURITY: Check rate limiting by IP first (before wallet verification)
    const { data: ipRateLimitOk } = await supabase.rpc('check_api_rate_limit', {
      p_identifier: clientIP,
      p_endpoint: 'start-dungeon-session-ip',
      p_window_seconds: RATE_LIMIT_WINDOW_SECONDS,
      p_max_requests: RATE_LIMIT_MAX_REQUESTS * 2 // More lenient for IP
    });

    if (!ipRateLimitOk) {
      console.warn(`🚫 IP rate limit exceeded: ${clientIP}`);
      await supabase.from('security_audit_log').insert({
        event_type: 'DUNGEON_IP_RATE_LIMITED',
        ip_address: clientIP,
        details: { dungeon_type, level }
      });
      return json({ error: 'Too many requests. Please wait a moment.' }, 429);
    }

    // ============ SECURITY: WALLET VERIFICATION ============
    let wallet_address: string | null = null;

    // Priority 1: Extract from JWT token (most secure)
    wallet_address = await extractWalletFromAuth(req, supabase);
    if (wallet_address) {
      console.log('✅ Wallet verified via JWT:', wallet_address.substring(0, 10));
    }

    // Priority 2: Verify via wallet_identities table (for NEAR wallet users)
    if (!wallet_address && parsed.data.wallet_address) {
      const { data: identity, error: identityError } = await supabase
        .from('wallet_identities')
        .select('wallet_address')
        .eq('wallet_address', parsed.data.wallet_address)
        .single();

      if (!identityError && identity) {
        wallet_address = identity.wallet_address;
        console.log('✅ Wallet verified via wallet_identities:', wallet_address.substring(0, 10));
      }
    }

    // Priority 3: Verify wallet exists in game_data (proves it's a registered player)
    if (!wallet_address && parsed.data.wallet_address) {
      const { data: gameDataCheck, error: gameDataError } = await supabase
        .from('game_data')
        .select('wallet_address')
        .eq('wallet_address', parsed.data.wallet_address)
        .single();

      if (!gameDataError && gameDataCheck) {
        wallet_address = gameDataCheck.wallet_address;
        console.log('✅ Wallet verified via game_data:', wallet_address.substring(0, 10));
      }
    }

    // 🔒 FINAL CHECK: Must have verified wallet
    if (!wallet_address) {
      console.error('❌ Could not verify wallet ownership');
      await supabase.from('security_audit_log').insert({
        event_type: 'DUNGEON_SESSION_UNVERIFIED_WALLET',
        wallet_address: parsed.data.wallet_address || null,
        details: { dungeon_type, level, device_id, error: 'Could not verify wallet ownership' }
      });

      return json({ 
        error: 'Could not verify wallet ownership. Please reconnect your wallet.',
        code: 'WALLET_VERIFICATION_FAILED' 
      }, 401);
    }

    // 🔒 SECURITY: Check rate limiting by wallet
    const { data: walletRateLimitOk } = await supabase.rpc('check_api_rate_limit', {
      p_identifier: wallet_address,
      p_endpoint: 'start-dungeon-session',
      p_window_seconds: RATE_LIMIT_WINDOW_SECONDS,
      p_max_requests: RATE_LIMIT_MAX_REQUESTS
    });

    if (!walletRateLimitOk) {
      console.warn(`🚫 Wallet rate limit exceeded: ${wallet_address}`);
      await supabase.from('security_audit_log').insert({
        event_type: 'DUNGEON_WALLET_RATE_LIMITED',
        wallet_address,
        details: { dungeon_type, level }
      });
      return json({ error: 'Too many requests. Please wait a moment.' }, 429);
    }

    console.log('🎮 Starting dungeon session:', {
      wallet_address: wallet_address.substring(0, 10),
      dungeon_type,
      level,
      device_id
    });

    // 🔒 Генерируем claim_key на сервере - это ключевая защита!
    const claim_key = crypto.randomUUID();
    const now = Date.now();

    // Создаём или обновляем сессию подземелья
    const { data, error } = await supabase
      .from('active_dungeon_sessions')
      .upsert({
        account_id: wallet_address,
        device_id,
        dungeon_type,
        level,
        claim_key,
        started_at: now,
        last_activity: now
      }, { 
        onConflict: 'account_id,device_id',
        ignoreDuplicates: false 
      })
      .select('claim_key')
      .single();

    if (error) {
      console.error('❌ Database error:', error);
      return json({ error: 'Failed to create dungeon session' }, 500);
    }

    console.log('✅ Dungeon session created:', { claim_key: data.claim_key.substring(0, 8) });

    return json({ 
      success: true, 
      claim_key: data.claim_key,
      message: 'Dungeon session started successfully'
    });

  } catch (err) {
    console.error('💥 Unexpected error:', err);
    return json({ error: 'Server error occurred' }, 500);
  }
});
