import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ 
        error: 'Missing authorization header',
        success: false 
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create client with user's JWT (may be anon) for contextual auth
    const userSupabase = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    });

    // Parse request body to get potential admin wallet fallback
    const reqBody = req.method === 'POST' ? await req.json().catch(() => ({})) : {};
    const bodyAdminWallet = reqBody?.adminWallet || reqBody?.wallet_address;

    // Try to resolve wallet from authenticated user first (if any)
    let resolvedWallet: string | null = null;
    const { data: authData } = await userSupabase.auth.getUser();
    const user = authData?.user || null;

    if (user) {
      const { data: userData } = await userSupabase
        .from('game_data')
        .select('wallet_address')
        .eq('user_id', user.id)
        .single();
      resolvedWallet = userData?.wallet_address || null;
    }

    // Fallback to wallet from request body
    const adminWallet = (resolvedWallet || bodyAdminWallet || '').toString();

    if (!adminWallet) {
      return new Response(JSON.stringify({
        error: 'Missing admin wallet. Provide in body as {"adminWallet": "<wallet>"}',
        success: false
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify admin via secure RPC
    const { data: isAdmin, error: roleErr } = await supabase.rpc('is_admin_or_super_wallet', {
      p_wallet_address: adminWallet
    });

    if (roleErr || !isAdmin) {
      return new Response(JSON.stringify({
        error: 'Unauthorized: Only admin can wipe game data',
        success: false
      }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('🔄 Starting game wipe...');

    // Reset all game_data to initial state
    const { error: gameDataError } = await supabase
      .from('game_data')
      .update({
        balance: 0,
        wood: 0,
        stone: 0,
        iron: 0,
        gold: 0,
        max_wood: 0,
        max_stone: 0,
        max_iron: 0,
        cards: [],
        inventory: [],
        dragon_eggs: [],
        selected_team: [],
        battle_state: null,
        account_level: 1,
        account_experience: 0,
        active_workers: [],
        active_building_upgrades: [],
        building_levels: {
          quarry: 0,
          medical: 0,
          sawmill: 0,
          storage: 0,
          barracks: 0,
          workshop: 0,
          main_hall: 0,
          dragon_lair: 0
        },
        barracks_upgrades: [],
        dragon_lair_upgrades: [],
        marketplace_listings: [],
        social_quests: [],
        adventure_player_stats: null,
        adventure_current_monster: null,
        wood_production_data: { isProducing: true, isStorageFull: false },
        stone_production_data: { isProducing: true, isStorageFull: false },
        initialized: true,
        updated_at: new Date().toISOString()
      })
      .neq('wallet_address', adminWallet); // Don't wipe admin data

    if (gameDataError) {
      console.error('❌ Error wiping game_data:', gameDataError);
      throw gameDataError;
    }

    // Clear card instances (except admin)
    const { error: cardInstancesError } = await supabase
      .from('card_instances')
      .delete()
      .neq('wallet_address', adminWallet);

    if (cardInstancesError) {
      console.error('❌ Error wiping card_instances:', cardInstancesError);
      throw cardInstancesError;
    }

    // Clear medical bay entries (except admin)
    const { error: medicalBayError } = await supabase
      .from('medical_bay')
      .delete()
      .neq('wallet_address', adminWallet);

    if (medicalBayError) {
      console.error('❌ Error wiping medical_bay:', medicalBayError);
      throw medicalBayError;
    }

    // Clear marketplace listings (except admin)
    const { error: marketplaceError } = await supabase
      .from('marketplace_listings')
      .delete()
      .neq('seller_wallet_address', adminWallet);

    if (marketplaceError) {
      console.error('❌ Error wiping marketplace_listings:', marketplaceError);
      throw marketplaceError;
    }

    // NOTE: Referral data (referrals and referral_earnings) is preserved during wipe
    // to maintain the referral tree structure across game resets

    console.log('✅ Game wipe completed successfully');

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Game wipe completed successfully' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('💥 Error in game-wipe function:', error);
    return new Response(JSON.stringify({ 
      error: (error as any)?.message || 'Unknown error',
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
