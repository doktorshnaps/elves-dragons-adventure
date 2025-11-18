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
    
    console.log(`🔄 Syncing cards for wallet: ${wallet_address}`);
    
    if (!wallet_address) {
      throw new Error('wallet_address is required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Call the sync RPC function
    const { data, error } = await supabase.rpc('sync_card_instances_from_game_data', {
      p_wallet_address: wallet_address
    });

    if (error) {
      console.error('❌ Error syncing cards:', error);
      throw error;
    }

    console.log(`✅ Synced ${data} cards for wallet ${wallet_address}`);

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
