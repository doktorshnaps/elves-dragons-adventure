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
    const { wallet_address } = await req.json();

    console.log(`🔄 Recalculating card stats for wallet: ${wallet_address || 'all wallets'}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Call the recalculation RPC function
    const { data, error } = await supabase.rpc('admin_recalculate_all_card_stats', {
      p_admin_wallet_address: wallet_address || null
    });

    if (error) {
      console.error('❌ Error recalculating card stats:', error);
      throw error;
    }

    console.log(`✅ Recalculation result:`, data);

    return new Response(
      JSON.stringify({
        success: true,
        result: data,
        message: `Successfully recalculated card stats`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error) {
    console.error('Error in admin-recalculate-card-stats:', error);
    return new Response(
      JSON.stringify({
        error: error.message,
        success: false
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
