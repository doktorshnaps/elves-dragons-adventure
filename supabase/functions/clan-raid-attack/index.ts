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

// Calculate raid damage from player's cards (server-side, can't be cheated)
async function calculateRaidDamage(supabase: any, walletAddress: string): Promise<number> {
  // Get player's active team snapshot from player_teams
  const { data: teamData } = await supabase
    .from('player_teams')
    .select('team_data, team_type')
    .eq('wallet_address', walletAddress)
    .eq('team_type', 'pvp')
    .limit(1)
    .maybeSingle();

  // Get all player card instances
  const { data: cards } = await supabase
    .from('card_instances')
    .select('id, card_type, max_power, max_magic, max_health, max_defense, card_data')
    .eq('wallet_address', walletAddress);

  if (!cards || cards.length === 0) {
    return 1000; // Minimum damage if no cards
  }

  let totalDamage = 0;

  // Try to use active team first
  if (teamData?.team_data) {
    const teamCards = Array.isArray(teamData.team_data) ? teamData.team_data : [];
    const teamCardIds = new Set(teamCards.map((c: any) => c.id || c.card_instance_id).filter(Boolean));

    if (teamCardIds.size > 0) {
      const activeCards = cards.filter((c: any) => teamCardIds.has(c.id));
      if (activeCards.length > 0) {
        for (const card of activeCards) {
          const rarity = card.card_data?.rarity || 1;
          const rarityMultiplier = 1 + (rarity - 1) * 0.5; // rarity 1=1x, 2=1.5x, 3=2x, etc.
          if (card.card_type === 'hero') {
            totalDamage += (card.max_power + card.max_magic * 0.5) * rarityMultiplier;
          } else if (card.card_type === 'dragon') {
            totalDamage += (card.max_magic + card.max_power * 0.5) * rarityMultiplier;
          }
        }
        return Math.floor(totalDamage * 100); // Scale up for boss HP
      }
    }
  }

  // Fallback: use all cards, take top 4
  const sortedCards = [...cards].sort((a: any, b: any) => {
    const aScore = a.max_power + a.max_magic;
    const bScore = b.max_power + b.max_magic;
    return bScore - aScore;
  }).slice(0, 4);

  for (const card of sortedCards) {
    const rarity = card.card_data?.rarity || 1;
    const rarityMultiplier = 1 + (rarity - 1) * 0.5;
    if (card.card_type === 'hero') {
      totalDamage += (card.max_power + card.max_magic * 0.5) * rarityMultiplier;
    } else if (card.card_type === 'dragon') {
      totalDamage += (card.max_magic + card.max_power * 0.5) * rarityMultiplier;
    } else {
      totalDamage += (card.max_power + card.max_magic) * rarityMultiplier;
    }
  }

  return Math.max(1000, Math.floor(totalDamage * 100));
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { wallet_address, raid_event_id } = body;

    if (!wallet_address || !raid_event_id) {
      return json({ success: false, error: 'Missing wallet_address or raid_event_id' }, 400);
    }

    const supabase = getSupabaseServiceClient();

    // 1. Load the raid event
    const { data: raid, error: raidError } = await supabase
      .from('clan_raid_events')
      .select('*')
      .eq('id', raid_event_id)
      .single();

    if (raidError || !raid) {
      return json({ success: false, error: 'Raid not found' }, 404);
    }

    if (raid.status !== 'active') {
      return json({ success: false, error: 'Raid is not active' }, 400);
    }

    if (new Date(raid.ends_at) < new Date()) {
      // Mark as expired
      await supabase
        .from('clan_raid_events')
        .update({ status: 'expired' })
        .eq('id', raid_event_id);
      return json({ success: false, error: 'Raid has expired' }, 400);
    }

    // 2. Check if player already attacked
    const { data: existingAttack } = await supabase
      .from('clan_raid_attacks')
      .select('id, damage_dealt')
      .eq('raid_event_id', raid_event_id)
      .eq('wallet_address', wallet_address)
      .maybeSingle();

    if (existingAttack) {
      return json({
        success: false,
        error: 'You already attacked this raid boss',
        already_attacked: true,
        damage_dealt: existingAttack.damage_dealt,
      });
    }

    // 3. Get player's clan
    const { data: memberData } = await supabase
      .from('clan_members')
      .select('clan_id')
      .eq('wallet_address', wallet_address)
      .maybeSingle();

    if (!memberData?.clan_id) {
      return json({ success: false, error: 'You must be in a clan to attack the raid boss' }, 400);
    }

    const clanId = memberData.clan_id;

    // 4. Get clan info for ranking
    const { data: clanData } = await supabase
      .from('clans')
      .select('name, emblem')
      .eq('id', clanId)
      .single();

    // 5. Calculate damage server-side
    const damage = await calculateRaidDamage(supabase, wallet_address);

    // 6. Get team snapshot
    const { data: teamSnapshot } = await supabase
      .from('player_teams')
      .select('team_data')
      .eq('wallet_address', wallet_address)
      .eq('team_type', 'pvp')
      .limit(1)
      .maybeSingle();

    // 7. Insert attack record
    const { error: attackError } = await supabase
      .from('clan_raid_attacks')
      .insert({
        raid_event_id,
        wallet_address,
        clan_id: clanId,
        damage_dealt: damage,
        team_snapshot: teamSnapshot?.team_data || null,
      });

    if (attackError) {
      if (attackError.code === '23505') {
        return json({ success: false, error: 'You already attacked this raid boss', already_attacked: true });
      }
      throw attackError;
    }

    // 8. Atomically reduce boss HP
    const { data: updatedRaid, error: updateError } = await supabase.rpc('clan_raid_apply_damage', {
      p_raid_id: raid_event_id,
      p_damage: damage,
    });

    if (updateError) {
      console.error('Error applying damage:', updateError);
      // Continue even if RPC fails, we already recorded the attack
    }

    const newHp = updatedRaid?.current_hp ?? Math.max(0, raid.current_hp - damage);
    const bossDefeated = newHp <= 0;

    // 9. Upsert clan ranking
    const { data: existingRanking } = await supabase
      .from('clan_raid_rankings')
      .select('id, total_damage, members_participated')
      .eq('raid_event_id', raid_event_id)
      .eq('clan_id', clanId)
      .maybeSingle();

    if (existingRanking) {
      await supabase
        .from('clan_raid_rankings')
        .update({
          total_damage: existingRanking.total_damage + damage,
          members_participated: existingRanking.members_participated + 1,
          clan_name: clanData?.name || '',
          clan_emblem: clanData?.emblem || null,
        })
        .eq('id', existingRanking.id);
    } else {
      await supabase
        .from('clan_raid_rankings')
        .insert({
          raid_event_id,
          clan_id: clanId,
          clan_name: clanData?.name || '',
          clan_emblem: clanData?.emblem || null,
          total_damage: damage,
          members_participated: 1,
        });
    }

    // 10. Get updated rankings
    const { data: rankings } = await supabase
      .from('clan_raid_rankings')
      .select('clan_id, clan_name, clan_emblem, total_damage, members_participated')
      .eq('raid_event_id', raid_event_id)
      .order('total_damage', { ascending: false })
      .limit(10);

    const myClanRank = (rankings || []).findIndex((r: any) => r.clan_id === clanId) + 1;

    return json({
      success: true,
      damage_dealt: damage,
      current_hp: newHp,
      boss_defeated: bossDefeated,
      my_clan_rank: myClanRank,
      rankings: rankings || [],
    });
  } catch (err: any) {
    console.error('clan-raid-attack error:', err);
    return json({ success: false, error: err.message || 'Internal error' }, 500);
  }
});
