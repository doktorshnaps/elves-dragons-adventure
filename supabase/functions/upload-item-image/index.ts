import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting function
async function checkRateLimit(supabaseClient: any, clientIp: string, endpoint: string): Promise<void> {
  const oneMinuteAgo = new Date(Date.now() - 60000).toISOString();
  
  const { count, error: countError } = await supabaseClient
    .from('api_rate_limits')
    .select('*', { count: 'exact', head: true })
    .eq('ip_address', clientIp)
    .eq('endpoint', endpoint)
    .gte('created_at', oneMinuteAgo);
  
  if (countError) {
    console.error('Rate limit check error:', countError);
    return;
  }
  
  if (count && count >= 3) {
    throw new Error('Rate limit exceeded: maximum 3 uploads per minute');
  }
  
  await supabaseClient
    .from('api_rate_limits')
    .insert({ ip_address: clientIp, endpoint: endpoint });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabaseServiceClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

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

    const { data: profile } = await supabaseServiceClient
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

    // Check super admin using server-resolved wallet
    const { data: isSuperAdmin, error: adminCheckError } = await supabaseServiceClient
      .rpc('is_super_admin_wallet', { p_wallet_address: walletAddress });

    if (adminCheckError || !isSuperAdmin) {
      return new Response(
        JSON.stringify({ error: 'Access denied: Only super admin can upload item images' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Rate limit check
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                     req.headers.get('x-real-ip') || 'unknown';
    try {
      await checkRateLimit(supabaseServiceClient, clientIp, 'upload-item-image');
    } catch (rateLimitError) {
      return new Response(
        JSON.stringify({ error: (rateLimitError as Error).message, retryAfter: 60 }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Retry-After': '60' } }
      );
    }

    const formData = await req.formData();
    const image = formData.get('image') as File;
    const filePath = formData.get('filePath') as string;

    if (!image || !filePath) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: image, filePath' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const imageBuffer = await image.arrayBuffer();
    const { data: uploadData, error: uploadError } = await supabaseServiceClient
      .storage
      .from('item-images')
      .upload(filePath, imageBuffer, {
        contentType: image.type,
        upsert: true,
      });

    if (uploadError) {
      return new Response(
        JSON.stringify({ error: 'Upload failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: publicUrlData } = supabaseServiceClient
      .storage
      .from('item-images')
      .getPublicUrl(filePath);

    return new Response(
      JSON.stringify({ 
        success: true, 
        url: publicUrlData.publicUrl,
        message: 'Item image uploaded successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('❌ Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
