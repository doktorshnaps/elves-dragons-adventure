import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const ALLOWED_TYPES = new Set(['emblem', 'background', 'header_background']);
const MAX_BYTES = 2 * 1024 * 1024; // 2MB

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const body = await req.json();
    const { wallet_address, clan_id, asset_type, image_base64, content_type } = body ?? {};

    if (!wallet_address || !clan_id || !asset_type || !image_base64) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (typeof wallet_address !== 'string' || wallet_address.length > 64 || !/^[a-zA-Z0-9._-]+$/.test(wallet_address)) {
      return new Response(
        JSON.stringify({ error: 'Invalid wallet address format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!ALLOWED_TYPES.has(asset_type)) {
      return new Response(
        JSON.stringify({ error: 'Invalid asset_type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Authorization: leader or deputy
    const { data: isAllowed, error: authError } = await supabase
      .rpc('is_clan_leader_or_deputy', { p_wallet: wallet_address, p_clan_id: clan_id });

    if (authError || !isAllowed) {
      return new Response(
        JSON.stringify({ error: 'Access denied: only clan leader/deputy can upload assets' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Decode base64 (strip optional data: prefix)
    const cleanBase64 = String(image_base64).replace(/^data:[^;]+;base64,/, '');
    let bytes: Uint8Array;
    try {
      const binary = atob(cleanBase64);
      bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    } catch (_e) {
      return new Response(
        JSON.stringify({ error: 'Invalid base64 image' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (bytes.length > MAX_BYTES) {
      return new Response(
        JSON.stringify({ error: 'File too large (max 2MB)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate WEBP magic bytes: "RIFF"...."WEBP"
    const isWebp =
      bytes.length > 12 &&
      bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
      bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;

    if (!isWebp) {
      return new Response(
        JSON.stringify({ error: 'Only WEBP format is allowed' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Rate limit: 10 uploads / minute per wallet+endpoint
    const oneMinuteAgo = new Date(Date.now() - 60000).toISOString();
    const { count } = await supabase
      .from('api_rate_limits')
      .select('*', { count: 'exact', head: true })
      .eq('ip_address', wallet_address)
      .eq('endpoint', 'upload-clan-asset')
      .gte('created_at', oneMinuteAgo);

    if (count && count >= 10) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded', retryAfter: 60 }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Retry-After': '60' } }
      );
    }

    await supabase
      .from('api_rate_limits')
      .insert({ ip_address: wallet_address, endpoint: 'upload-clan-asset' });

    const filePath = `${clan_id}/${asset_type}.webp`;
    const { error: uploadError } = await supabase
      .storage
      .from('clan-assets')
      .upload(filePath, bytes, {
        contentType: content_type || 'image/webp',
        upsert: true,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return new Response(
        JSON.stringify({ error: 'Upload failed', details: uploadError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: publicUrlData } = supabase
      .storage
      .from('clan-assets')
      .getPublicUrl(filePath);

    return new Response(
      JSON.stringify({
        success: true,
        url: `${publicUrlData.publicUrl}?t=${Date.now()}`,
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
