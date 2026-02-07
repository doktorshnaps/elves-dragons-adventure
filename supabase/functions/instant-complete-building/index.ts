import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  wallet_address: string;
  building_id: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const { wallet_address, building_id }: RequestBody = await req.json();

    console.log('⚡ Instant complete building request:', { wallet_address, building_id });

    // 1. Verify admin status
    const { data: isAdmin, error: adminError } = await supabaseClient.rpc(
      'is_admin_or_super_wallet',
      { p_wallet_address: wallet_address }
    );

    if (adminError || !isAdmin) {
      console.error('❌ Admin check failed:', adminError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Admin verified');

    // 2. Get current game data
    const { data: gameData, error: gameError } = await supabaseClient
      .from('game_data')
      .select('active_building_upgrades, building_levels')
      .eq('wallet_address', wallet_address)
      .single();

    if (gameError || !gameData) {
      console.error('❌ Failed to fetch game data:', gameError);
      return new Response(
        JSON.stringify({ error: 'Game data not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('📊 Current game data:', gameData);

    const upgrades = Array.isArray(gameData.active_building_upgrades) 
      ? gameData.active_building_upgrades 
      : [];
    
    const buildingLevels = gameData.building_levels || {};

    // 3. Find the building upgrade (optional for admin instant-complete)
    const upgradeIndex = upgrades.findIndex((u: any) => u.buildingId === building_id);
    
    let targetLevel: number;
    let updatedUpgrades: any[];

    if (upgradeIndex !== -1) {
      // Upgrade exists in queue — complete it
      const upgrade = upgrades[upgradeIndex];
      console.log('🔨 Found upgrade:', upgrade);
      targetLevel = upgrade.targetLevel || ((buildingLevels[building_id] || 0) + 1);
      updatedUpgrades = upgrades.filter((_: any, i: number) => i !== upgradeIndex);
    } else {
      // No active upgrade — admin force-set to current+1
      console.log('⚠️ No active upgrade found, admin force-completing:', building_id);
      targetLevel = (buildingLevels[building_id] || 0) + 1;
      updatedUpgrades = upgrades;
    }

    const updatedBuildingLevels = {
      ...buildingLevels,
      [building_id]: targetLevel
    };

    console.log('⚡ Completing upgrade:', {
      building_id,
      currentLevel: buildingLevels[building_id] || 0,
      targetLevel
    });

    // 5. Update game_data
    const { error: updateError } = await supabaseClient
      .from('game_data')
      .update({
        building_levels: updatedBuildingLevels,
        active_building_upgrades: updatedUpgrades,
        updated_at: new Date().toISOString()
      })
      .eq('wallet_address', wallet_address);

    if (updateError) {
      console.error('❌ Failed to update game data:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to complete upgrade' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Building upgrade completed instantly:', {
      building_id,
      new_level: targetLevel,
      updated_levels: updatedBuildingLevels
    });

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
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
