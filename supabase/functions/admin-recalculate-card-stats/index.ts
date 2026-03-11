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

    if (!wallet_address || typeof wallet_address !== 'string' || wallet_address.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'wallet_address is required', success: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify the caller is an admin
    const { data: isAdmin, error: adminError } = await supabase.rpc('is_admin_or_super_wallet', {
      p_wallet_address: wallet_address,
    });

    if (adminError || !isAdmin) {
      console.error('❌ Unauthorized recalculate attempt by:', wallet_address);
      return new Response(
        JSON.stringify({ error: 'Unauthorized: admin access required', success: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      );
    }

    console.log(`🔄 Recalculating card stats for wallet: ${wallet_address} (admin verified)`);

    const { data, error } = await supabase.rpc('admin_recalculate_all_card_stats', {
      p_admin_wallet_address: wallet_address
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
