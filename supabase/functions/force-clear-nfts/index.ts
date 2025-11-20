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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { wallet_address, contract_id } = await req.json();

    if (!wallet_address) {
      throw new Error('wallet_address is required');
    }

    console.log(`🧹 Force clearing NFT cards for wallet: ${wallet_address}`);

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
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
