import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

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

    // Require JWT and resolve wallet server-side — no body fallback
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ 
        error: 'Unauthorized: missing Authorization header',
        success: false 
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: authData, error: authError } = await userClient.auth.getUser();
    if (authError || !authData?.user) {
      return new Response(JSON.stringify({
        error: 'Unauthorized: invalid token',
        success: false
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('wallet_address')
      .eq('user_id', authData.user.id)
      .single();

    const adminWallet = profile?.wallet_address;
    if (!adminWallet) {
      return new Response(JSON.stringify({
        error: 'No wallet linked to this account',
        success: false
      }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify admin via secure RPC using server-resolved wallet
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
        balance: 100,
        wood: 0,
        stone: 0,
        iron: 0,
        gold: 0,
        max_wood: 0,
        max_stone: 0,
        max_iron: 0,
        cards: [],
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
          dragon_lair: 0,
          forge: 0,
          clan_hall: 0
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
      .neq('wallet_address', adminWallet);

    if (gameDataError) {
      console.error('❌ Error wiping game_data:', gameDataError);
      throw gameDataError;
    }

    // Clear card instances (except admin)
    const { error: cardInstancesError } = await supabase
      .from('card_instances')
      .delete()
      .neq('wallet_address', adminWallet);

    if (cardInstancesError) throw cardInstancesError;

    const { error: medicalBayError } = await supabase
      .from('medical_bay')
      .delete()
      .neq('wallet_address', adminWallet);

    if (medicalBayError) throw medicalBayError;

    const { error: itemInstancesError } = await supabase
      .from('item_instances')
      .delete()
      .neq('wallet_address', adminWallet);

    if (itemInstancesError) throw itemInstancesError;

    const { error: soulDonationsError } = await supabase
      .from('soul_donations')
      .delete()
      .neq('wallet_address', adminWallet);

    if (soulDonationsError) throw soulDonationsError;

    const { error: shopResetError } = await supabase
      .from('shop_inventory')
      .update({
        available_quantity: 50,
        last_reset_time: new Date().toISOString(),
        next_reset_time: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString()
      })
      .not('id', 'is', null);

    if (shopResetError) throw shopResetError;

    const { error: questsResetError } = await supabase
      .from('quests')
      .update({
        is_active: true,
        updated_at: new Date().toISOString()
      })
      .not('id', 'is', null);

    if (questsResetError) throw questsResetError;

    // Clear player teams (root cause of stale team bug)
    const { error: playerTeamsError } = await supabase
      .from('player_teams')
      .delete()
      .neq('wallet_address', adminWallet);
    if (playerTeamsError) throw playerTeamsError;

    // Clear PvP data (order matters: moves/sessions → matches)
    const { error: pvpMovesError } = await supabase
      .from('pvp_moves')
      .delete()
      .not('id', 'is', null);
    if (pvpMovesError) throw pvpMovesError;

    const { error: pvpSessionsError } = await supabase
      .from('pvp_match_sessions')
      .delete()
      .not('id', 'is', null);
    if (pvpSessionsError) throw pvpSessionsError;

    const { error: pvpQueueError } = await supabase
      .from('pvp_queue')
      .delete()
      .not('id', 'is', null);
    if (pvpQueueError) throw pvpQueueError;

    const { error: pvpMatchesError } = await supabase
      .from('pvp_matches')
      .delete()
      .not('id', 'is', null);
    if (pvpMatchesError) throw pvpMatchesError;

    const { error: pvpRatingsError } = await supabase
      .from('pvp_ratings')
      .delete()
      .neq('wallet_address', adminWallet);
    if (pvpRatingsError) throw pvpRatingsError;

    const { error: pvpDecksError } = await supabase
      .from('pvp_decks')
      .delete()
      .neq('wallet_address', adminWallet);
    if (pvpDecksError) throw pvpDecksError;

    // Clear forge bay
    const { error: forgeBayError } = await supabase
      .from('forge_bay')
      .delete()
      .neq('wallet_address', adminWallet);
    if (forgeBayError) throw forgeBayError;

    // Clear active dungeon sessions
    const { error: dungeonSessionsError } = await supabase
      .from('active_dungeon_sessions')
      .delete()
      .neq('account_id', adminWallet);
    if (dungeonSessionsError) throw dungeonSessionsError;

    // Clear referral earnings (but NOT referral links)
    const { error: referralEarningsError } = await supabase
      .from('referral_earnings')
      .delete()
      .not('id', 'is', null);
    if (referralEarningsError) throw referralEarningsError;

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
      error: 'Internal server error',
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
