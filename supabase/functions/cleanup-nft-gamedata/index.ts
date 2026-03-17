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
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Require JWT and resolve wallet server-side
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized: missing Authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: authData, error: authError } = await userClient.auth.getUser();
    if (authError || !authData?.user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized: invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('wallet_address')
      .eq('user_id', authData.user.id)
      .single();

    const wallet_address = profile?.wallet_address;
    if (!wallet_address) {
      return new Response(
        JSON.stringify({ success: false, error: 'No wallet linked to this account' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`🧹 Cleaning NFT cards from game_data for wallet: ${wallet_address}`);

    const { data: gameData, error: fetchError } = await supabase
      .from('game_data')
      .select('cards')
      .eq('wallet_address', wallet_address)
      .single();

    if (fetchError) {
      throw fetchError;
    }

    const cards = gameData?.cards || [];
    const nftCount = cards.filter((c: any) => c.isNFT).length;

    const cleanedCards = cards.filter((c: any) => !c.isNFT);

    const { error: updateError } = await supabase
      .from('game_data')
      .update({ 
        cards: cleanedCards,
        updated_at: new Date().toISOString()
      })
      .eq('wallet_address', wallet_address);

    if (updateError) {
      throw updateError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        nft_cards_removed: nftCount,
        regular_cards_remaining: cleanedCards.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Error in cleanup-nft-gamedata:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
