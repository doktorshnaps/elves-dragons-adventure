import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (data: any, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

const getSupabaseServiceClient = () => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !supabaseServiceKey) throw new Error('Missing Supabase env vars');
  return createClient(supabaseUrl, supabaseServiceKey);
};

// Distribute ELL rewards to player wallets
async function distributeRewardToPlayer(
  supabase: any,
  walletAddress: string,
  ellAmount: number,
  raidEventId: string,
  rewardReason: string
): Promise<boolean> {
  try {
    // Use update_game_data_by_wallet_v2 RPC if available, otherwise direct update
    const { data: gameData } = await supabase
      .from('game_data')
      .select('wallet_address, balance')
      .eq('wallet_address', walletAddress)
      .maybeSingle();

    if (!gameData) {
      console.warn(`No game data found for wallet ${walletAddress}`);
      return false;
    }

    // Use the existing RPC function for safe balance update
    const { error } = await supabase.rpc('admin_add_balance', {
      p_admin_wallet_address: 'system',
      p_target_wallet: walletAddress,
      p_amount: ellAmount,
    });

    if (error) {
      // Fallback: direct balance update
      console.warn('RPC failed, trying direct update:', error.message);
      const { error: directError } = await supabase
        .from('game_data')
        .update({ balance: gameData.balance + ellAmount })
        .eq('wallet_address', walletAddress);

      if (directError) {
        console.error(`Failed to distribute reward to ${walletAddress}:`, directError);
        return false;
      }
    }

    console.log(`✅ Distributed ${ellAmount} ELL to ${walletAddress} for ${rewardReason}`);
    return true;
  } catch (err) {
    console.error(`Error distributing reward to ${walletAddress}:`, err);
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = getSupabaseServiceClient();

    // Find all raids that ended but haven't distributed rewards yet
    const { data: expiredRaids, error: raidError } = await supabase
      .from('clan_raid_events')
      .select('*')
      .in('status', ['active', 'defeated'])
      .eq('rewards_distributed', false)
      .lt('ends_at', new Date().toISOString());

    if (raidError) throw raidError;

    if (!expiredRaids || expiredRaids.length === 0) {
      return json({ success: true, message: 'No raids to process', processed: 0 });
    }

    let processedCount = 0;
    const results = [];

    for (const raid of expiredRaids) {
      console.log(`Processing raid: ${raid.id} (${raid.boss_name})`);

      // Mark as expired if still active
      if (raid.status === 'active') {
        await supabase
          .from('clan_raid_events')
          .update({ status: 'expired' })
          .eq('id', raid.id);
      }

      // Get clan rankings for this raid
      const { data: rankings } = await supabase
        .from('clan_raid_rankings')
        .select('clan_id, clan_name, total_damage, members_participated')
        .eq('raid_event_id', raid.id)
        .order('total_damage', { ascending: false });

      if (!rankings || rankings.length === 0) {
        // No attackers - just mark as distributed
        await supabase
          .from('clan_raid_events')
          .update({ rewards_distributed: true })
          .eq('id', raid.id);
        continue;
      }

      // Assign ranks
      for (let i = 0; i < rankings.length; i++) {
        await supabase
          .from('clan_raid_rankings')
          .update({ rank: i + 1 })
          .eq('raid_event_id', raid.id)
          .eq('clan_id', rankings[i].clan_id);
      }

      // Set winner clan
      const winnerClanId = rankings[0]?.clan_id;
      if (winnerClanId) {
        await supabase
          .from('clan_raid_events')
          .update({ winner_clan_id: winnerClanId })
          .eq('id', raid.id);
      }

      const bossDefeated = raid.status === 'defeated' || raid.current_hp <= 0;
      let rewardedPlayers = 0;

      // Distribute rewards to all attackers
      for (let rankIdx = 0; rankIdx < rankings.length; rankIdx++) {
        const clanRanking = rankings[rankIdx];
        const clanRank = rankIdx + 1;

        // Get all attackers for this clan
        const { data: attackers } = await supabase
          .from('clan_raid_attacks')
          .select('wallet_address, damage_dealt')
          .eq('raid_event_id', raid.id)
          .eq('clan_id', clanRanking.clan_id);

        if (!attackers || attackers.length === 0) continue;

        for (const attacker of attackers) {
          let ellReward = raid.reward_participant; // Base reward for all participants

          if (bossDefeated) {
            // Bonus rewards for killing the boss, based on clan rank
            if (clanRank === 1) {
              ellReward += raid.reward_first_place;
            } else if (clanRank <= 3) {
              ellReward += raid.reward_second_place;
            }
          }

          const success = await distributeRewardToPlayer(
            supabase,
            attacker.wallet_address,
            ellReward,
            raid.id,
            `Raid ${raid.boss_name} - rank #${clanRank} (${bossDefeated ? 'boss defeated' : 'participation'})`
          );

          if (success) rewardedPlayers++;
        }
      }

      // Mark as distributed
      await supabase
        .from('clan_raid_events')
        .update({ rewards_distributed: true })
        .eq('id', raid.id);

      processedCount++;
      results.push({
        raid_id: raid.id,
        boss_name: raid.boss_name,
        boss_defeated: bossDefeated,
        rewarded_players: rewardedPlayers,
        clan_rankings: rankings.length,
      });

      console.log(`✅ Processed raid ${raid.boss_name}: ${rewardedPlayers} players rewarded`);
    }

    return json({
      success: true,
      processed: processedCount,
      results,
    });
  } catch (err: any) {
    console.error('clan-raid-distribute-rewards error:', err);
    return json({ success: false, error: err.message || 'Internal error' }, 500);
  }
});
