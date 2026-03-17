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
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Require JWT and resolve wallet server-side
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: missing Authorization header', success: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: authData, error: authError } = await userClient.auth.getUser();
    if (authError || !authData?.user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: invalid token', success: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('wallet_address')
      .eq('user_id', authData.user.id)
      .single();

    const walletAddress = profile?.wallet_address;
    if (!walletAddress) {
      return new Response(
        JSON.stringify({ error: 'No wallet linked to this account', success: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      );
    }

    // Verify admin using server-resolved wallet
    const { data: isAdmin, error: adminError } = await supabase.rpc('is_admin_or_super_wallet', {
      p_wallet_address: walletAddress,
    });

    if (adminError || !isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: admin access required', success: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      );
    }

    console.log(`🔄 Recalculating card stats (admin: ${walletAddress})`);

    const { data, error } = await supabase.rpc('admin_recalculate_all_card_stats', {
      p_admin_wallet_address: walletAddress
    });

    if (error) {
      console.error('❌ Error recalculating card stats:', error);
      throw error;
    }

    return new Response(
      JSON.stringify({
        success: true,
        result: data,
        message: 'Successfully recalculated card stats'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Error in admin-recalculate-card-stats:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', success: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
