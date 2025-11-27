import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChallengeRequest {
  wallet_address: string;
  session_id: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { wallet_address, session_id }: ChallengeRequest = await req.json();

    if (!wallet_address || !session_id) {
      return new Response(
        JSON.stringify({ error: 'Missing wallet_address or session_id' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('🔐 [get-claim-challenge] Generating nonce for:', { wallet_address, session_id });

    // Verify session exists and belongs to wallet
    const { data: session, error: sessionError } = await supabase
      .from('active_dungeon_sessions')
      .select('*')
      .eq('claim_key', session_id)
      .eq('account_id', wallet_address)
      .single();

    if (sessionError || !session) {
      console.error('❌ [get-claim-challenge] Session not found:', sessionError);
      return new Response(
        JSON.stringify({ error: 'Invalid session' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Generate nonce using RPC function
    const { data: challenge, error: nonceError } = await supabase
      .rpc('generate_claim_nonce', {
        p_wallet_address: wallet_address,
        p_session_id: session_id
      });

    if (nonceError) {
      console.error('❌ [get-claim-challenge] Failed to generate nonce:', nonceError);
      return new Response(
        JSON.stringify({ error: 'Failed to generate challenge' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('✅ [get-claim-challenge] Nonce generated:', challenge);

    return new Response(
      JSON.stringify({
        success: true,
        challenge: challenge
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('💥 [get-claim-challenge] Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
