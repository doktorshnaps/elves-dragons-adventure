import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Validate Authorization header and extract caller identity
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: missing Authorization header', success: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: invalid token', success: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const userId = claimsData.claims.sub;

    // Use service role client for privileged operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Resolve wallet address from profiles (server-side, not from request body)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('wallet_address')
      .eq('user_id', userId)
      .single();

    if (profileError || !profile?.wallet_address) {
      return new Response(
        JSON.stringify({ error: 'Could not resolve wallet address for authenticated user', success: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const wallet_address = profile.wallet_address;

    // Verify the caller is an admin using server-resolved wallet
    const { data: isAdmin, error: adminError } = await supabase.rpc('is_admin_or_super_wallet', {
      p_wallet_address: wallet_address,
    });

    if (adminError || !isAdmin) {
      console.error('❌ Unauthorized sync attempt by:', wallet_address);
      return new Response(
        JSON.stringify({ error: 'Unauthorized: admin access required', success: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      );
    }

    // Get target wallet from request body (the wallet to sync cards for)
    const { wallet_address: target_wallet } = await req.json();
    
    if (!target_wallet || typeof target_wallet !== 'string' || target_wallet.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'wallet_address (target) is required', success: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log(`🔄 Syncing cards for target wallet: ${target_wallet} (admin: ${wallet_address})`);

    // Call the sync RPC function
    const { data, error } = await supabase.rpc('sync_card_instances_from_game_data', {
      p_wallet_address: target_wallet
    });

    if (error) {
      console.error('❌ Error syncing cards:', error);
      throw error;
    }

    console.log(`✅ Synced ${data} cards for wallet ${target_wallet}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        synced_count: data,
        message: `Successfully synced ${data} cards`
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error in sync-player-cards:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        success: false 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
