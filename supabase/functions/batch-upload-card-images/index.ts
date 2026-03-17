import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CardImageMapping {
  uuid: string;
  cardName: string;
  cardType: string;
  faction: string;
  rarity: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Require JWT and resolve wallet server-side
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: missing Authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: authData, error: authError } = await userClient.auth.getUser();
    if (authError || !authData?.user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('wallet_address')
      .eq('user_id', authData.user.id)
      .single();

    const walletAddress = profile?.wallet_address;
    if (!walletAddress) {
      return new Response(
        JSON.stringify({ error: 'No wallet linked to this account' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check admin using server-resolved wallet
    const { data: isAdmin, error: adminError } = await supabaseAdmin
      .rpc('is_admin_or_super_wallet', { p_wallet_address: walletAddress });

    if (adminError || !isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Only admins can batch upload card images' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { mappings } = await req.json();

    if (!mappings || !Array.isArray(mappings)) {
      return new Response(
        JSON.stringify({ error: 'Invalid request: mappings array required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results: { success: number; failed: number; errors: string[] } = {
      success: 0,
      failed: 0,
      errors: []
    };

    for (const mapping of mappings as CardImageMapping[]) {
      try {
        const { uuid, cardName, cardType, faction, rarity } = mapping;

        if (!uuid || !cardName || !cardType || !rarity) {
          results.failed++;
          results.errors.push(`Missing required fields for mapping: ${JSON.stringify(mapping)}`);
          continue;
        }

        const imageUrl = `/lovable-uploads/${uuid}.webp`;

        const { error: dbError } = await supabaseAdmin
          .from('card_images')
          .upsert({
            card_name: cardName,
            card_type: cardType,
            faction: faction || null,
            rarity: rarity,
            image_url: imageUrl,
            created_by_wallet_address: walletAddress
          }, {
            onConflict: 'card_name,card_type,rarity,faction'
          });

        if (dbError) {
          results.failed++;
          results.errors.push(`Failed to insert ${cardName}: ${dbError.message}`);
        } else {
          results.success++;
        }
      } catch (err) {
        results.failed++;
        results.errors.push(`Error processing mapping: ${(err as Error).message}`);
      }
    }

    return new Response(
      JSON.stringify({ 
        message: `Batch upload completed: ${results.success} success, ${results.failed} failed`,
        results 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
