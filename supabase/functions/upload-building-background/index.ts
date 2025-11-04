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

    const token = authHeader.replace('Bearer ', '');
    const supabaseUserClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: `Bearer ${token}` },
        },
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const { data: userData } = await supabaseUserClient.auth.getUser();
    if (!userData.user) {
      throw new Error('User not authenticated');
    }

    const formData = await req.formData();
    const image = formData.get('image') as File;
    const filePath = formData.get('filePath') as string;
    const buildingId = formData.get('buildingId') as string;
    const walletAddress = formData.get('walletAddress') as string;

    if (!image || !filePath || !buildingId || !walletAddress) {
      throw new Error('Missing required fields: image, filePath, buildingId, walletAddress');
    }

    console.log('📤 Upload request:', { filePath, buildingId, walletAddress });

    // Проверяем права admin или super_admin через RPC
    const { data: isAdminOrSuper, error: roleCheckError } = await supabaseServiceClient
      .rpc('is_admin_or_super_wallet', { p_wallet_address: walletAddress });

    console.log('🔐 Admin or Super check result:', { isAdminOrSuper, error: roleCheckError });

    if (roleCheckError || !isAdminOrSuper) {
      throw new Error('Access denied: Only admin or super admin can upload building backgrounds');
    }

    // Загружаем изображение в storage
    const imageBuffer = await image.arrayBuffer();
    const { data: uploadData, error: uploadError } = await supabaseServiceClient
      .storage
      .from('building-backgrounds')
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
      .from('building-backgrounds')
      .getPublicUrl(filePath);

    const publicUrl = publicUrlData.publicUrl;
    console.log('🔗 Public URL:', publicUrl);

    // Обновляем все конфигурации этого здания с новым URL
    const { error: updateError } = await supabaseServiceClient
      .from('building_configs')
      .update({ 
        background_image_url: publicUrl,
        updated_at: new Date().toISOString()
      })
      .eq('building_id', buildingId);

    if (updateError) {
      console.error('❌ Update error:', updateError);
      throw updateError;
    }

    console.log('✅ Updated building configs for:', buildingId);

    return new Response(
      JSON.stringify({ 
        success: true, 
        url: publicUrl,
        message: `Background image uploaded for ${buildingId}`
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
