import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { wallet_address } = await req.json();
    
    if (!wallet_address || typeof wallet_address !== 'string' || wallet_address.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'wallet_address is required', success: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the caller is an admin
    const { data: isAdmin, error: adminError } = await supabase.rpc('is_admin_or_super_wallet', {
      p_wallet_address: wallet_address,
    });

    if (adminError || !isAdmin) {
      console.error('❌ [migrate-cards-to-instances] Unauthorized attempt by:', wallet_address);
      return new Response(
        JSON.stringify({ error: 'Unauthorized: admin access required', success: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      );
    }

    console.log('🔄 [migrate-cards-to-instances] Starting migration for wallet:', wallet_address, '(admin verified)');

    // Вызываем RPC функцию для миграции
    const { data, error } = await supabase.rpc('migrate_cards_to_instances', {
      p_wallet_address: wallet_address
    });

    if (error) {
      console.error('❌ [migrate-cards-to-instances] RPC error:', error);
      throw error;
    }

    console.log('✅ [migrate-cards-to-instances] Migration successful:', data);

    return new Response(
      JSON.stringify({ 
        success: true,
        ...data
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('❌ [migrate-cards-to-instances] Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Migration failed'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
