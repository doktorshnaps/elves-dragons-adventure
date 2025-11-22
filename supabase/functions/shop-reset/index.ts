import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

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

    // Parse request body to check for force flag
    const body = req.method === 'POST' ? await req.json().catch(() => ({})) : {};
    const force = body?.force === true;

    // Call RPC with force parameter
    console.log(`🔄 Shop inventory reset requested (force: ${force})`);
    const { data: resetResult, error: resetError } = await supabase.rpc('reset_shop_inventory', { 
      p_force: force 
    });

    if (resetError) {
      console.error('❌ Error resetting shop:', resetError);
      throw resetError;
    }

    // Check if reset was actually performed
    if (!resetResult?.success) {
      console.log(`⏸️ Shop reset skipped: ${resetResult?.message || 'Unknown reason'}`);
      return new Response(JSON.stringify({ 
        success: false,
        message: resetResult?.message || 'Shop reset time not reached',
        next_reset_time: resetResult?.next_reset_time,
        current_time: resetResult?.current_time
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch inventory after successful reset
    const { data: inventoryData, error: fetchError } = await supabase
      .from('shop_inventory')
      .select('*')
      .order('item_id');

    if (fetchError) {
      console.error('❌ Error fetching inventory:', fetchError);
      throw fetchError;
    }

    console.log(`✅ Shop inventory reset successful: ${inventoryData?.length || 0} items, next reset: ${resetResult.next_reset_time}`);

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Shop reset successfully',
      inventory: inventoryData || [],
      next_reset_time: resetResult.next_reset_time,
      items_per_refresh: resetResult.items_per_refresh
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('💥 Error in shop-reset function:', error);
    return new Response(JSON.stringify({ 
      error: (error as any)?.message || 'Unknown error',
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});