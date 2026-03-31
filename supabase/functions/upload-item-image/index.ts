import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

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

    const formData = await req.formData();
    const image = formData.get('image') as File;
    const filePath = formData.get('filePath') as string;
    const walletAddress = formData.get('walletAddress') as string;

    if (!image || !filePath || !walletAddress) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: image, filePath, walletAddress' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate wallet address format
    if (walletAddress.length > 64 || !/^[a-zA-Z0-9._-]+$/.test(walletAddress)) {
      return new Response(
        JSON.stringify({ error: 'Invalid wallet address format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check super admin using wallet address
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
    
    const oneMinuteAgo = new Date(Date.now() - 60000).toISOString();
    const { count } = await supabaseServiceClient
      .from('api_rate_limits')
      .select('*', { count: 'exact', head: true })
      .eq('ip_address', clientIp)
      .eq('endpoint', 'upload-item-image')
      .gte('created_at', oneMinuteAgo);

    if (count && count >= 3) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded: maximum 3 uploads per minute', retryAfter: 60 }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Retry-After': '60' } }
      );
    }

    await supabaseServiceClient
      .from('api_rate_limits')
      .insert({ ip_address: clientIp, endpoint: 'upload-item-image' });

    // Upload image
    const imageBuffer = await image.arrayBuffer();
    const { data: uploadData, error: uploadError } = await supabaseServiceClient
      .storage
      .from('item-images')
      .upload(filePath, imageBuffer, {
        contentType: image.type,
        upsert: true,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
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
