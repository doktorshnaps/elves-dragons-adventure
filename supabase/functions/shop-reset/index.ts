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

    console.log('🔄 Starting shop reset check...');

    // Проверяем, нужно ли сбросить магазин
    const { data: inventoryData, error: fetchError } = await supabase
      .from('shop_inventory')
      .select('*')
      .lte('next_reset_time', new Date().toISOString());

    if (fetchError) {
      console.error('❌ Error fetching inventory:', fetchError);
      throw fetchError;
    }

    console.log(`📦 Found ${inventoryData?.length || 0} items needing reset`);

    if (inventoryData && inventoryData.length > 0) {
      // Вызываем функцию сброса магазина
      const { error: resetError } = await supabase.rpc('reset_shop_inventory');

      if (resetError) {
        console.error('❌ Error resetting shop:', resetError);
        throw resetError;
      }

      console.log('✅ Shop inventory reset successfully');
      
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Shop inventory reset',
        reset_items: inventoryData.length 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      console.log('ℹ️ No reset needed');
      
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'No reset needed' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
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