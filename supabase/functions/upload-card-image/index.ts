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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Create admin client with service role key
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Get the authorization header for checking admin status
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create client with user's token to check admin status
    const supabaseClient = createClient(
      supabaseUrl,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get form data
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const filePath = formData.get('filePath') as string;
    const walletAddress = formData.get('walletAddress') as string;
    const cardName = formData.get('cardName') as string;
    const cardType = formData.get('cardType') as string;
    const faction = formData.get('faction') as string;
    const rarity = parseInt(formData.get('rarity') as string);

    console.log('Upload request:', { filePath, walletAddress, cardName, cardType, faction, rarity });

    if (!file || !filePath || !walletAddress) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin using RPC
    const { data: isAdmin, error: adminError } = await supabaseClient
      .rpc('is_admin_or_super_wallet', { p_wallet_address: walletAddress });

    console.log('Admin check:', { isAdmin, adminError });

    if (adminError || !isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Only admins can upload card images' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Convert file to ArrayBuffer
    const fileBuffer = await file.arrayBuffer();

    // Upload to storage using service role (bypasses RLS)
    const { error: uploadError } = await supabaseAdmin.storage
      .from('card-images')
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return new Response(
        JSON.stringify({ error: uploadError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('card-images')
      .getPublicUrl(filePath);

    console.log('Upload successful, public URL:', publicUrl);

    // Save to database using service role
    const { error: dbError } = await supabaseAdmin
      .from('card_images')
      .upsert({
        card_name: cardName,
        card_type: cardType,
        faction: faction,
        rarity: rarity,
        image_url: publicUrl,
        created_by_wallet_address: walletAddress
      }, {
        onConflict: 'card_name,card_type,rarity,faction'
      });

    if (dbError) {
      console.error('DB error:', dbError);
      return new Response(
        JSON.stringify({ error: dbError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ publicUrl }),
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
