import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      'https://oimhwdymghkwxznjarkv.supabase.co',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('🔄 Starting periodic NFT whitelist validation...');

    // Вызываем проверку всех автоматических записей
    const checkResponse = await fetch(`${req.url.replace('/validate-nft-whitelist', '/check-nft-whitelist')}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ check_all_automatic: true })
    });

    const result = await checkResponse.json();

    console.log('✅ Periodic validation completed:', result);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Periodic NFT whitelist validation completed',
        result: result
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in validate-nft-whitelist:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});