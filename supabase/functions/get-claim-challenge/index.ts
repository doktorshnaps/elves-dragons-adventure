import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// 🔒 Input validation schema
const ChallengeRequestSchema = z.object({
  wallet_address: z.string().min(3).max(100),
  session_id: z.string().uuid(),
});

// Rate limiting configuration
const RATE_LIMIT_WINDOW_SECONDS = 60;
const RATE_LIMIT_MAX_REQUESTS = 20; // Max 20 challenge requests per minute

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

Deno.serve(async (req) => {
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
      return json({ error: 'Invalid request body' }, 400);
    }

    const parseResult = ChallengeRequestSchema.safeParse(body);
    if (!parseResult.success) {
      console.error('❌ Validation error:', parseResult.error.flatten());
      return json({ error: 'Invalid request parameters' }, 400);
    }

    const { wallet_address, session_id } = parseResult.data;
    console.log('🔐 [get-claim-challenge] Generating nonce for:', { wallet_address: wallet_address.substring(0, 10), session_id: session_id.substring(0, 8) });

    // 🔒 SECURITY: Check rate limiting
    const { data: rateLimitOk } = await supabase.rpc('check_api_rate_limit', {
      p_identifier: wallet_address,
      p_endpoint: 'get-claim-challenge',
      p_window_seconds: RATE_LIMIT_WINDOW_SECONDS,
      p_max_requests: RATE_LIMIT_MAX_REQUESTS
    });

    if (!rateLimitOk) {
      console.warn(`🚫 Rate limit exceeded for wallet: ${wallet_address}`);
      await supabase.from('security_audit_log').insert({
        event_type: 'CHALLENGE_RATE_LIMITED',
        wallet_address,
        details: { session_id }
      });
      return json({ error: 'Too many requests. Please wait a moment.' }, 429);
    }

    // Verify session exists and belongs to wallet
    const { data: session, error: sessionError } = await supabase
      .from('active_dungeon_sessions')
      .select('*')
      .eq('claim_key', session_id)
      .eq('account_id', wallet_address)
      .single();

    if (sessionError || !session) {
      console.error('❌ [get-claim-challenge] Session not found:', sessionError);
      await supabase.from('security_audit_log').insert({
        event_type: 'CHALLENGE_INVALID_SESSION',
        wallet_address,
        details: { session_id, error: 'Session not found' }
      });
      return json({ error: 'Invalid session' }, 404);
    }

    // Generate nonce using RPC function
    const { data: challenge, error: nonceError } = await supabase
      .rpc('generate_claim_nonce', {
        p_wallet_address: wallet_address,
        p_session_id: session_id
      });

    if (nonceError) {
      console.error('❌ [get-claim-challenge] Failed to generate nonce:', nonceError);
      return json({ error: 'Failed to generate challenge' }, 500);
    }

    console.log('✅ [get-claim-challenge] Nonce generated:', challenge);

    return json({
      success: true,
      challenge: challenge
    });

  } catch (error) {
    console.error('💥 [get-claim-challenge] Unexpected error:', error);
    return json({ error: 'Internal server error' }, 500);
  }
});
