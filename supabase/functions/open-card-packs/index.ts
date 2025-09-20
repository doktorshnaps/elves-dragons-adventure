import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestData {
  p_wallet_address: string;
  p_pack_name: string;
  p_count: number;
  p_new_cards: any[];
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🎴 Opening card packs edge function called');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { p_wallet_address, p_pack_name, p_count, p_new_cards }: RequestData = await req.json();
    
    console.log('🎴 Request data:', { p_wallet_address, p_pack_name, p_count, cardsCount: p_new_cards.length });

    // Call the SQL function to open card packs
    const { data, error } = await supabase.rpc('open_card_packs', {
      p_wallet_address,
      p_pack_name,
      p_count,
      p_new_cards
    });

    if (error) {
      console.error('🎴 Error opening card packs:', error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('🎴 Card packs opened successfully:', data);

    return new Response(
      JSON.stringify({ success: true, data }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('🎴 Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});