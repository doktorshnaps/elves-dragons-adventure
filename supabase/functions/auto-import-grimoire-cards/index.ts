import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CardData {
  name: string;
  type: string;
  faction: string;
  image: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Require JWT and resolve wallet server-side
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: missing Authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
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
    const { data: isAdmin, error: adminError } = await supabaseAdmin.rpc('is_admin_or_super_wallet', {
      p_wallet_address: walletAddress
    });

    if (adminError || !isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { cards } = await req.json();

    if (!cards || !Array.isArray(cards)) {
      return new Response(
        JSON.stringify({ error: 'Missing cards array' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results = {
      success: 0,
      skipped: 0,
      errors: [] as string[]
    };

    for (const card of cards as CardData[]) {
      try {
        const rarity = 1;
        const cardType = card.type === 'character' ? 'hero' : card.type === 'pet' ? 'dragon' : card.type;
        const imageUrl = card.image.replace('/lovable-uploads/', '').replace('.webp', '');

        const { error: upsertError } = await supabaseAdmin
          .from('card_images')
          .upsert({
            card_name: card.name,
            card_type: cardType,
            faction: card.faction,
            rarity: rarity,
            image_url: `https://oimhwdymghkwxznjarkv.supabase.co/storage/v1/object/public/lovable-uploads/${imageUrl}`,
            created_by_wallet_address: walletAddress
          }, {
            onConflict: 'card_name,card_type,faction,rarity',
            ignoreDuplicates: false
          });

        if (upsertError) {
          results.errors.push(`${card.name} (${card.faction}): ${upsertError.message}`);
        } else {
          results.success++;
        }
      } catch (err: any) {
        results.errors.push(`${card.name}: ${err.message}`);
      }
    }

    return new Response(
      JSON.stringify({
        message: `✅ Импортировано: ${results.success}, Пропущено: ${results.skipped}`,
        results
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Auto-import error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
