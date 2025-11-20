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

    const { wallet_address } = await req.json();

    if (!wallet_address) {
      throw new Error('wallet_address is required');
    }

    console.log(`🧹 Cleaning NFT cards from game_data for wallet: ${wallet_address}`);

    // Получаем текущие cards
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
    console.log(`Found ${nftCount} NFT cards in game_data`);

    // Фильтруем только не-NFT карты
    const cleanedCards = cards.filter((c: any) => !c.isNFT);
    console.log(`After filtering: ${cleanedCards.length} regular cards remain`);

    // Обновляем game_data
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

    console.log(`✅ Successfully cleaned ${nftCount} NFT cards from game_data`);

    return new Response(
      JSON.stringify({
        success: true,
        nft_cards_removed: nftCount,
        regular_cards_remaining: cleanedCards.length
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in cleanup-nft-gamedata:', error);
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
