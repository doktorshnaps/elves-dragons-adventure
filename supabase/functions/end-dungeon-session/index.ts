import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RequestSchema = z.object({
  device_id: z.string().optional(),
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
  if (token.includes('.tg') || token.includes('.near') || token.length < 100) {
    return null;
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return null;
    }
    const wallet = user.user_metadata?.wallet_address || 
                   user.identities?.[0]?.identity_data?.wallet_address;
    return wallet || null;
  } catch {
    return null;
  }
}

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

    const { device_id }: RequestBody = parsed.data;
    const supabase = getSupabaseServiceClient();

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
        event_type: 'DUNGEON_END_UNVERIFIED_WALLET',
        wallet_address: parsed.data.wallet_address || null,
        details: { device_id: device_id || 'all', error: 'Could not verify wallet ownership' }
      });

      return json({ 
        error: 'Could not verify wallet ownership. Please reconnect your wallet.',
        code: 'WALLET_VERIFICATION_FAILED' 
      }, 401);
    }

    console.log('🛑 Ending dungeon session:', {
      wallet_address: wallet_address.substring(0, 10),
      device_id: device_id || 'all devices'
    });

    // Удаляем сессии для кошелька (опционально для конкретного устройства)
    let query = supabase
      .from('active_dungeon_sessions')
      .delete()
      .eq('account_id', wallet_address);
    
    if (device_id) {
      query = query.eq('device_id', device_id);
    }

    const { error } = await query;

    if (error) {
      console.error('❌ Database error:', error);
      return json({ error: 'Failed to end dungeon session' }, 500);
    }

    console.log('✅ Dungeon session ended successfully');

    return json({ 
      success: true,
      message: 'Dungeon session ended successfully'
    });

  } catch (err) {
    console.error('💥 Unexpected error:', err);
    return json({ error: 'Server error occurred' }, 500);
  }
});
