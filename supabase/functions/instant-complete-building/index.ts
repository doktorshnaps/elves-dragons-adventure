import { createClient } from 'jsr:@supabase/supabase-js@2';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RequestSchema = z.object({
  wallet_address: z.string().min(2).max(100),
  building_id: z.string().min(1).max(50).regex(/^[a-zA-Z0-9_-]+$/),
});

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

    // Validate input
    const body = await req.json();
    const parseResult = RequestSchema.safeParse(body);

    if (!parseResult.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid input parameters', details: parseResult.error.flatten().fieldErrors }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { wallet_address, building_id } = parseResult.data;

    // Verify admin status via RPC
    const { data: isAdmin, error: adminError } = await supabase.rpc(
      'is_admin_or_super_wallet',
      { p_wallet_address: wallet_address }
    );

    if (adminError || !isAdmin) {
      console.error('❌ Admin check failed:', adminError?.message || 'Not an admin');
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get current game data
    const { data: gameData, error: gameError } = await supabase
      .from('game_data')
      .select('active_building_upgrades, building_levels')
      .eq('wallet_address', wallet_address)
      .single();

    if (gameError || !gameData) {
      console.error('❌ Game data not found:', gameError?.message);
      return new Response(
        JSON.stringify({ error: 'Game data not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const upgrades = Array.isArray(gameData.active_building_upgrades) 
      ? gameData.active_building_upgrades 
      : [];
    
    const buildingLevels = (gameData.building_levels as Record<string, number>) || {};
    const upgradeIndex = upgrades.findIndex((u: any) => u.buildingId === building_id);
    
    let targetLevel: number;
    let updatedUpgrades: any[];

    if (upgradeIndex !== -1) {
      const upgrade = upgrades[upgradeIndex];
      targetLevel = upgrade.targetLevel || ((buildingLevels[building_id] || 0) + 1);
      updatedUpgrades = upgrades.filter((_: any, i: number) => i !== upgradeIndex);
    } else {
      targetLevel = (buildingLevels[building_id] || 0) + 1;
      updatedUpgrades = upgrades;
    }

    const updatedBuildingLevels = {
      ...buildingLevels,
      [building_id]: targetLevel
    };

    const { error: updateError } = await supabase
      .from('game_data')
      .update({
        building_levels: updatedBuildingLevels,
        active_building_upgrades: updatedUpgrades,
        updated_at: new Date().toISOString()
      })
      .eq('wallet_address', wallet_address);

    if (updateError) {
      console.error('❌ Update failed:', updateError.message);
      return new Response(
        JSON.stringify({ error: 'Failed to complete upgrade' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`✅ ${building_id} instantly upgraded to level ${targetLevel} for ${wallet_address}`);

    return new Response(
      JSON.stringify({
        success: true,
        building_id,
        new_level: targetLevel,
        message: `${building_id} instantly upgraded to level ${targetLevel}`
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('❌ Error in instant-complete-building:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
