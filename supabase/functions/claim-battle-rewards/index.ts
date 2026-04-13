import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MAX_KILLED_MONSTERS_PER_CLAIM = 1000;

const KilledMonsterSchema = z.object({
  monster_name: z.string().max(200),
  level: z.number().min(1).max(100)
});

const ClaimBodySchema = z.object({
  claim_key: z.string().uuid(),
  nonce: z.string().min(1),
  dungeon_type: z.string(),
  level: z.number().min(1).max(100),
  killed_monsters: z.array(KilledMonsterSchema).max(MAX_KILLED_MONSTERS_PER_CLAIM),
  card_kills: z.array(z.object({
    card_template_id: z.string(),
    kills: z.number().min(1)
  })),
  card_health_updates: z.array(z.object({
    card_instance_id: z.string(),
    current_health: z.number().min(0),
    current_defense: z.number().min(0)
  }))
});

type ClaimBody = z.infer<typeof ClaimBodySchema>;

const json = (data: any, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

const getSupabaseServiceClient = () => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables');
  }
  return createClient(supabaseUrl, supabaseServiceKey);
};

// Расчет наград на основе dungeon_settings
async function calculateRewards(
  supabase: any,
  dungeonType: string,
  level: number,
  dungeonNumber: number,
  killedMonsters: Array<{ monster_name: string; level: number }>
) {
  console.log('💰 [calculateRewards] Starting calculation', { dungeonType, level, monstersKilled: killedMonsters.length });

  const { data: dungeonSettings, error: settingsError } = await supabase
    .from('dungeon_settings')
    .select('*')
    .eq('dungeon_number', dungeonNumber)
    .single();

  if (settingsError || !dungeonSettings) {
    console.error('❌ Dungeon settings not found', settingsError);
    throw new Error('Dungeon settings not found');
  }

  console.log('✅ Dungeon settings loaded:', dungeonSettings.dungeon_name);

  let ell_reward = 0;
  let experience_reward = 0;
  
  for (const monster of killedMonsters) {
    const monsterLevel = monster.level;
    const monsterNameLower = monster.monster_name.toLowerCase();
    
    const ellForThisMonster = 10 + (monsterLevel * 2);
    ell_reward += ellForThisMonster;
    
    if (monsterNameLower.includes('boss') && !monsterNameLower.includes('mini')) {
      experience_reward += 200;
    } else if (monsterNameLower.includes('mini') || monsterNameLower.includes('мини')) {
      experience_reward += 100;
    } else {
      experience_reward += 50;
    }
  }
  
  ell_reward = Math.floor(ell_reward);

  console.log('💎 Base rewards calculated:', { ell_reward, experience_reward, monstersKilled: killedMonsters.length });

  // Рассчитываем дроп предметов
  const items: any[] = [];
  
  const { data: itemDrops, error: dropsError } = await supabase
    .from('dungeon_item_drops')
    .select(`
      *,
      item_templates:item_template_id (*)
    `)
    .eq('dungeon_number', dungeonNumber)
    .eq('is_active', true)
    .lte('min_dungeon_level', level)
    .or(`max_dungeon_level.is.null,max_dungeon_level.gte.${level}`);

  if (dropsError) {
    console.error('❌ Error loading item drops', dropsError);
  } else if (itemDrops && itemDrops.length > 0) {
    console.log(`🎁 Found ${itemDrops.length} possible item drops for dungeon ${dungeonNumber}, level ${level}`);

    for (const monster of killedMonsters) {
      const cleanMonsterName = monster.monster_name.replace(/\s*\(Lv\d+\)\s*$/i, '').trim();
      
      for (const dropConfig of itemDrops) {
        const allowedMonsters = dropConfig.allowed_monsters || [];
        const canDrop = allowedMonsters.length === 0 || allowedMonsters.includes(cleanMonsterName);
        
        if (!canDrop) continue;

        const roll = (Math.floor(Math.random() * 10000) + 1) / 100;
        const dropChance = dropConfig.drop_chance || 0;

        if (roll <= dropChance) {
          const template = dropConfig.item_templates;
          if (template) {
            console.log(`✅ Item dropped: ${template.name} from ${cleanMonsterName} (roll: ${roll.toFixed(2)} <= ${dropChance}%)`);
            
            items.push({
              template_id: template.id,
              item_id: template.item_id,
              name: template.name,
              type: template.type,
              quantity: 1
            });
          }
        }
      }
    }
  }

  // ========== TREASURE HUNT (only calculate, don't update DB yet) ==========
  const treasureHuntFindings: Array<{ event_id: string; quantity: number }> = [];

  const { data: treasureEvent } = await supabase
    .from('treasure_hunt_events')
    .select('*')
    .eq('is_active', true)
    .or(`dungeon_number.is.null,dungeon_number.eq.${dungeonNumber}`)
    .maybeSingle();

  if (treasureEvent) {
    console.log('🎯 Active treasure hunt event found:', treasureEvent.item_name);
    
    if (!treasureEvent.ended_at || new Date(treasureEvent.ended_at) > new Date()) {
      let treasureDropCount = 0;

      for (const monster of killedMonsters) {
        const cleanMonsterName = monster.monster_name.replace(/\s*\(Lv\d+\)\s*$/i, '').trim();
        const monsterIdLower = treasureEvent.monster_id?.toLowerCase() || '';
        const cleanNameLower = cleanMonsterName.toLowerCase();
        
        const matchesMonster = !treasureEvent.monster_id || 
                              cleanNameLower.includes(monsterIdLower) ||
                              monsterIdLower.includes(cleanNameLower);
        
        if (!matchesMonster) continue;

        // 🔒 Atomic check: UPDATE with WHERE to prevent race condition
        const { data: updatedEvent, error: updateError } = await supabase
          .from('treasure_hunt_events')
          .update({ found_quantity: treasureEvent.found_quantity + treasureDropCount + 1 })
          .eq('id', treasureEvent.id)
          .lt('found_quantity', treasureEvent.total_quantity)
          .select('id')
          .maybeSingle();

        if (updateError || !updatedEvent) {
          console.log('⚠️ Treasure hunt item limit reached or update failed');
          continue;
        }

        const roll = (Math.floor(Math.random() * 10000) + 1) / 100;
        const dropChance = treasureEvent.drop_chance || 0;
        
        if (roll <= dropChance) {
          console.log(`🎊 TREASURE HUNT ITEM DROPPED! ${treasureEvent.item_name}`);
          treasureDropCount++;
          
          const { data: template } = await supabase
            .from('item_templates')
            .select('*')
            .eq('id', treasureEvent.item_template_id)
            .single();
          
          if (template) {
            items.push({
              template_id: template.id,
              item_id: template.item_id,
              name: template.name,
              type: template.type,
              quantity: 1,
              isTreasureHunt: true,
              treasureHuntEventId: treasureEvent.id
            });
          }
        } else {
          // Roll failed, revert the atomic increment
          await supabase
            .from('treasure_hunt_events')
            .update({ found_quantity: treasureEvent.found_quantity + treasureDropCount })
            .eq('id', treasureEvent.id);
        }
      }

      // Aggregate treasure hunt findings for the RPC
      if (treasureDropCount > 0) {
        treasureHuntFindings.push({
          event_id: treasureEvent.id,
          quantity: treasureDropCount
        });
      }
    }
  }

  console.log(`🎉 Total items calculated: ${items.length}, treasure hunt findings: ${treasureHuntFindings.length}`);

  return {
    ell_reward,
    experience_reward,
    items,
    treasureHuntFindings
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log('📦 [claim-battle-rewards] Received request with claim_key:', body.claim_key?.substring(0, 8));

    const parseResult = ClaimBodySchema.safeParse(body);
    if (!parseResult.success) {
      console.error('❌ Validation error:', parseResult.error.errors);
      return json({ ok: false, error: 'Invalid request', code: 'VALIDATION_ERROR' }, 400);
    }

    const claimBody: ClaimBody = parseResult.data;
    const supabase = getSupabaseServiceClient();

    // ============ SECURITY LAYER 1: NONCE VALIDATION ============
    console.log('🔐 [claim-battle-rewards] Validating nonce...');
    
    const { data: nonceData, error: nonceError } = await supabase
      .from('claim_nonces')
      .select('*')
      .eq('nonce', claimBody.nonce)
      .single();

    if (nonceError || !nonceData) {
      console.error('❌ [claim-battle-rewards] Invalid nonce:', nonceError);
      await supabase.from('security_audit_log').insert({
        event_type: 'INVALID_NONCE',
        wallet_address: null,
        claim_key: claimBody.claim_key,
        details: { nonce: claimBody.nonce, error: 'Nonce not found' }
      }).then(null, () => {});
      return json({ ok: false, error: 'Invalid nonce', code: 'INVALID_NONCE' }, 401);
    }

    if (nonceData.used_at) {
      console.error('❌ [claim-battle-rewards] Nonce already used');
      return json({ ok: false, error: 'Nonce already used', code: 'NONCE_USED' }, 401);
    }

    const nonceAge = Date.now() - new Date(nonceData.created_at).getTime();
    if (nonceAge > 5 * 60 * 1000) {
      console.error('❌ [claim-battle-rewards] Nonce expired');
      await supabase.from('claim_nonces').delete().eq('nonce', claimBody.nonce);
      return json({ ok: false, error: 'Nonce expired', code: 'NONCE_EXPIRED' }, 401);
    }

    console.log('✅ [claim-battle-rewards] Nonce validated');

    // ============ SECURITY LAYER 2: RATE LIMITING ============
    const { data: rateLimitOk } = await supabase
      .rpc('check_claim_rate_limit', {
        p_wallet_address: nonceData.wallet_address,
        p_max_claims_per_minute: 10
      });

    if (!rateLimitOk) {
      console.error('❌ [claim-battle-rewards] Rate limit exceeded');
      return json({ ok: false, error: 'Too many claim attempts, please wait', code: 'RATE_LIMITED' }, 429);
    }

    // ============ SECURITY LAYER 3: SESSION VALIDATION ============
    const { data: session, error: sessionError } = await supabase
      .from('active_dungeon_sessions')
      .select('account_id, dungeon_type, level')
      .eq('claim_key', claimBody.claim_key)
      .single();

    if (sessionError || !session) {
      console.error('❌ Invalid or expired claim key:', sessionError);
      return json({ ok: false, error: 'Invalid or expired session', code: 'INVALID_SESSION' }, 403);
    }

    const wallet_address = session.account_id;

    if (nonceData.wallet_address !== wallet_address) {
      console.error('❌ Wallet mismatch');
      return json({ ok: false, error: 'Invalid session', code: 'WALLET_MISMATCH' }, 401);
    }

    if (nonceData.session_id !== claimBody.claim_key) {
      console.error('❌ Session ID mismatch');
      return json({ ok: false, error: 'Invalid nonce for session', code: 'SESSION_MISMATCH' }, 401);
    }

    if (session.dungeon_type !== claimBody.dungeon_type) {
      console.error('❌ Dungeon type mismatch');
      return json({ ok: false, error: 'Dungeon type mismatch', code: 'DUNGEON_MISMATCH' }, 403);
    }

    if (claimBody.level > session.level) {
      console.error('❌ Level mismatch (claimed > session)');
      return json({ ok: false, error: `Level mismatch: claimed ${claimBody.level} but session has ${session.level}`, code: 'LEVEL_MISMATCH' }, 403);
    }
    
    const effectiveLevel = session.level;

    console.log('✅ Session validated:', {
      wallet: wallet_address.substring(0, 10),
      dungeon: session.dungeon_type,
      level: session.level
    });

    // 🎯 SERVER-SIDE REWARD CALCULATION
    const dungeonTypeMap: Record<string, number> = {
      'spider_nest': 1,
      'forgotten_souls': 2,
      'bone_dungeon': 3,
      'dark_mage': 4,
      'sea_serpent': 5,
      'ice_throne': 6,
      'dragon_lair': 7,
      'pantheon_gods': 8
    };

    const dungeonNumber = dungeonTypeMap[claimBody.dungeon_type] || 1;

    console.log('🎲 Calculating rewards on server side...');
    let { ell_reward, experience_reward, items, treasureHuntFindings } = await calculateRewards(
      supabase,
      claimBody.dungeon_type,
      effectiveLevel,
      dungeonNumber,
      claimBody.killed_monsters
    );

    // Server-side ELL cap
    const maxReasonableEll = Math.max(5000, session.level * 600);
    if (ell_reward > maxReasonableEll) {
      console.error('❌ ELL reward exceeds cap:', { ell_reward, cap: maxReasonableEll });
      await supabase.from('security_audit_log').insert({
        event_type: 'REWARD_CAP_EXCEEDED',
        wallet_address,
        claim_key: claimBody.claim_key,
        details: { ell_reward, cap: maxReasonableEll, monsters: claimBody.killed_monsters.length }
      }).then(null, () => {});
      ell_reward = maxReasonableEll;
    }

    console.log('💎 Server-calculated rewards:', {
      ell_reward,
      experience_reward,
      items: items.length,
      treasureHuntFindings: treasureHuntFindings.length
    });

    // ============ ATOMIC APPLICATION via apply_battle_rewards_v2 ============
    // This RPC handles: idempotency check, reward_claims insert, game_data update,
    // item_instances, card_kills, card_health, AND treasure_hunt_findings — ALL in one transaction
    console.log('🎯 Calling apply_battle_rewards_v2 RPC (atomic)');
    
    const { data: rpcResult, error: rpcError } = await supabase.rpc('apply_battle_rewards_v2', {
      p_wallet_address: wallet_address,
      p_claim_key: claimBody.claim_key,
      p_ell_reward: ell_reward,
      p_experience_reward: experience_reward,
      p_items: items,
      p_card_kills: claimBody.card_kills,
      p_card_health_updates: claimBody.card_health_updates,
      p_treasure_hunt_findings: treasureHuntFindings
    });

    if (rpcError) {
      console.error('❌ RPC error:', rpcError);
      return json({ ok: false, error: 'Failed to apply battle rewards', code: 'RPC_ERROR', diagnostics: rpcError.message }, 500);
    }

    // Check if already claimed (idempotency inside RPC)
    if (rpcResult?.already_claimed) {
      console.log('⚠️ Claim already processed (detected inside RPC):', claimBody.claim_key);
      return json({ 
        success: true, 
        message: 'Reward already claimed', 
        duplicate: true,
        rewards: { ell_reward: 0, experience_reward: 0, items: [] }
      });
    }

    console.log('✅ Rewards applied atomically:', rpcResult);

    // ✅ POST-PROCESSING (non-critical, failures won't lose rewards)
    
    // Update quest progress
    try {
      const monstersKilledCount = claimBody.killed_monsters.length;
      if (monstersKilledCount > 0) {
        await supabase.rpc('update_daily_quest_progress', {
          p_wallet_address: wallet_address,
          p_quest_key: 'kill_monsters_5',
          p_increment: monstersKilledCount
        });
        await supabase.rpc('update_daily_quest_progress', {
          p_wallet_address: wallet_address,
          p_quest_key: 'kill_monsters_100',
          p_increment: monstersKilledCount
        });
      }
      await supabase.rpc('update_daily_quest_progress', {
        p_wallet_address: wallet_address,
        p_quest_key: 'complete_dungeon_1',
        p_increment: 1
      });
      console.log('✅ Quest progress updated');
    } catch (questError) {
      console.error('⚠️ Failed to update quest progress (non-critical):', questError);
    }

    // Mark nonce as used
    await supabase
      .from('claim_nonces')
      .update({ used_at: new Date().toISOString() })
      .eq('nonce', claimBody.nonce);

    // Delete session
    await supabase
      .from('active_dungeon_sessions')
      .delete()
      .eq('claim_key', claimBody.claim_key);

    // Audit log
    await supabase.from('security_audit_log').insert({
      event_type: 'CLAIM_SUCCESS',
      wallet_address,
      claim_key: claimBody.claim_key,
      details: {
        ell_reward,
        experience_reward,
        items_count: items.length,
        level: claimBody.level,
        dungeon_type: claimBody.dungeon_type,
        treasure_hunt_findings: treasureHuntFindings.length
      }
    }).then(null, () => {});

    console.log('✅ Rewards applied successfully:', {
      wallet: wallet_address.substring(0, 10),
      ell: ell_reward,
      exp: experience_reward,
      items: items.length
    });

    return json({
      success: true,
      message: 'Battle rewards claimed successfully',
      results: rpcResult,
      rewards: {
        ell_reward,
        experience_reward,
        items
      }
    });

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    
    try {
      const supabase = getSupabaseServiceClient();
      await supabase.from('security_audit_log').insert({
        event_type: 'CRITICAL_ERROR',
        claim_key: null,
        details: { error: error.message, stack: error.stack, name: error.name }
      });
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
    
    return json({ ok: false, error: 'Internal server error', code: 'INTERNAL_ERROR' }, 500);
  }
});
