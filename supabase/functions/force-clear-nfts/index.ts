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

    // Resolve wallet address from profiles (server-side)
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

    const caller_wallet = profile.wallet_address;

    // Verify the caller is an admin using server-resolved wallet
    const { data: isAdmin, error: adminError } = await supabase.rpc('is_admin_or_super_wallet', {
      p_wallet_address: caller_wallet,
    });

    if (adminError || !isAdmin) {
      console.error('❌ Unauthorized force-clear-nfts attempt by:', caller_wallet);
      return new Response(
        JSON.stringify({ error: 'Unauthorized: admin access required', success: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      );
    }

    const { wallet_address, contract_id } = await req.json();

    if (!wallet_address) {
      throw new Error('wallet_address is required');
    }

    console.log(`🧹 Force clearing NFT cards for wallet: ${wallet_address} (admin: ${caller_wallet})`);

    const { data, error } = await supabase.rpc('force_clear_nft_cards', {
      p_wallet_address: wallet_address,
      p_contract_id: contract_id || null
    });

    if (error) {
      console.error('Error clearing NFT cards:', error);
      throw error;
    }

    console.log(`✅ Cleared ${data} NFT card records`);

    return new Response(
      JSON.stringify({
        success: true,
        deleted_count: data
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in force-clear-nfts:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
