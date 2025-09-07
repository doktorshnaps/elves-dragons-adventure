import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Always reset inventory (function handles both empty and expired cases)
    console.log('🔄 Forcing shop inventory reset via RPC');
    const { error: resetError } = await supabase.rpc('reset_shop_inventory');
    if (resetError) {
      console.error('❌ Error resetting shop:', resetError);
      throw resetError;
    }

    // Fetch inventory after reset
    const { data: inventoryData, error: fetchError } = await supabase
      .from('shop_inventory')
      .select('*')
      .order('item_id');

    if (fetchError) {
      console.error('❌ Error fetching inventory:', fetchError);
      throw fetchError;
    }

    console.log(`✅ Shop inventory ready: ${inventoryData?.length || 0} items`);

    return new Response(JSON.stringify({ 
      success: true, 
      inventory: inventoryData || [] 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('💥 Error in shop-reset function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});