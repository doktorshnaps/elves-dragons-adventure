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
    const supabaseServiceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing Authorization header');
    }

    const formData = await req.formData();
    const image = formData.get('image') as File;
    const filePath = formData.get('filePath') as string;
    const walletAddress = formData.get('walletAddress') as string;

    if (!image || !filePath || !walletAddress) {
      throw new Error('Missing required fields: image, filePath, walletAddress');
    }

    console.log('📤 Item image upload request:', { filePath, walletAddress });

    // Проверяем права super_admin через RPC
    const { data: isSuperAdmin, error: adminCheckError } = await supabaseServiceClient
      .rpc('is_super_admin_wallet', { p_wallet_address: walletAddress });

    console.log('🔐 Super admin check result:', { isSuperAdmin, error: adminCheckError });

    if (adminCheckError || !isSuperAdmin) {
      throw new Error('Access denied: Only super admin can upload item images');
    }

    // Загружаем изображение в storage
    const imageBuffer = await image.arrayBuffer();
    const { data: uploadData, error: uploadError } = await supabaseServiceClient
      .storage
      .from('item-images')
      .upload(filePath, imageBuffer, {
        contentType: image.type,
        upsert: true,
      });

    if (uploadError) {
      console.error('❌ Upload error:', uploadError);
      throw uploadError;
    }

    console.log('✅ Upload successful:', uploadData);

    // Получаем публичный URL
    const { data: publicUrlData } = supabaseServiceClient
      .storage
      .from('item-images')
      .getPublicUrl(filePath);

    const publicUrl = publicUrlData.publicUrl;
    console.log('🔗 Public URL:', publicUrl);

    return new Response(
      JSON.stringify({ 
        success: true, 
        url: publicUrl,
        message: 'Item image uploaded successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('❌ Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
