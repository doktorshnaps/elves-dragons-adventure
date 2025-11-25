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

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      supabaseUrl,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { mappings, walletAddress } = await req.json();

    if (!walletAddress || !mappings || !Array.isArray(mappings)) {
      return new Response(
        JSON.stringify({ error: 'Invalid request: walletAddress and mappings array required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Batch upload request:', { walletAddress, count: mappings.length });

    // Check if user is admin
    const { data: isAdmin, error: adminError } = await supabaseClient
      .rpc('is_admin_or_super_wallet', { p_wallet_address: walletAddress });

    if (adminError || !isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Only admins can batch upload card images' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results: { success: number; failed: number; errors: string[] } = {
      success: 0,
      failed: 0,
      errors: []
    };

    // Process each mapping
    for (const mapping of mappings as CardImageMapping[]) {
      try {
        const { uuid, cardName, cardType, faction, rarity } = mapping;

        if (!uuid || !cardName || !cardType || !rarity) {
          results.failed++;
          results.errors.push(`Missing required fields for mapping: ${JSON.stringify(mapping)}`);
          continue;
        }

        // Construct image URL
        const imageUrl = `/lovable-uploads/${uuid}.webp`;

        // Insert into database using service role (bypasses RLS)
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
          console.error('DB error for mapping:', mapping, dbError);
          results.failed++;
          results.errors.push(`Failed to insert ${cardName}: ${dbError.message}`);
        } else {
          results.success++;
          console.log('Successfully mapped:', { cardName, faction, rarity, imageUrl });
        }
      } catch (err) {
        results.failed++;
        results.errors.push(`Error processing mapping: ${err.message}`);
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
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
