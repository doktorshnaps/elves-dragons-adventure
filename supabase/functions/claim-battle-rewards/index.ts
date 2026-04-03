import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Схема для данных убитых монстров
const KilledMonsterSchema = z.object({
  monster_name: z.string().max(200),
  level: z.number().min(1).max(100)
});

// 🔒 КРИТИЧЕСКОЕ ИЗМЕНЕНИЕ: Клиент отправляет только минимум данных,
// сервер рассчитывает все награды сам
// ENHANCED SECURITY: Добавлен nonce для challenge-response pattern
const ClaimBodySchema = z.object({
  claim_key: z.string().uuid(),
  nonce: z.string().min(1),
  dungeon_type: z.string(),
  level: z.number().min(1).max(100),
  killed_monsters: z.array(KilledMonsterSchema).max(300),
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

  // Получаем настройки подземелья
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

  // Рассчитываем базовые награды (ELL и опыт) на основе уровня КАЖДОГО монстра
  let ell_reward = 0;
  let experience_reward = 0;
  
  for (const monster of killedMonsters) {
    const monsterLevel = monster.level;
    const monsterNameLower = monster.monster_name.toLowerCase();
    
    // ELL рассчитывается по уровню конкретного монстра
    // Формула: 10 + (уровень_монстра * 2)
    const ellForThisMonster = 10 + (monsterLevel * 2);
    ell_reward += ellForThisMonster;
    
    // EXP = фиксированная сумма в зависимости от типа монстра
    if (monsterNameLower.includes('boss') && !monsterNameLower.includes('mini')) {
      experience_reward += 200; // Босс
    } else if (monsterNameLower.includes('mini') || monsterNameLower.includes('мини')) {
      experience_reward += 100; // Мини-босс
    } else {
      experience_reward += 50; // Обычный монстр
    }
  }
  
  ell_reward = Math.floor(ell_reward);

  console.log('💎 Base rewards calculated:', { ell_reward, experience_reward, monstersKilled: killedMonsters.length });

  // Рассчитываем дроп предметов на основе dungeon_item_drops
  const items: any[] = [];
  
  // Получаем все возможные дропы для этого подземелья и уровня
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

    // Для каждого убитого монстра проверяем дроп предметов
    for (const monster of killedMonsters) {
      const cleanMonsterName = monster.monster_name.replace(/\s*\(Lv\d+\)\s*$/i, '').trim();
      
      for (const dropConfig of itemDrops) {
        // Проверяем, может ли этот монстр дропать этот предмет
        const allowedMonsters = dropConfig.allowed_monsters || [];
        const canDrop = allowedMonsters.length === 0 || allowedMonsters.includes(cleanMonsterName);
        
        if (!canDrop) continue;

        // Генерируем число от 0.01 до 100.00
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
        } else {
          console.log(`❌ No drop: ${dropConfig.item_templates?.name} (roll: ${roll.toFixed(2)} > ${dropChance}%)`);
        }
      }
    }
  }

  // Проверяем активное treasure hunt событие
  const { data: treasureEvent } = await supabase
    .from('treasure_hunt_events')
    .select('*')
    .eq('is_active', true)
    .or(`dungeon_number.is.null,dungeon_number.eq.${dungeonNumber}`)
    .maybeSingle();

  if (treasureEvent) {
    console.log('🎯 Active treasure hunt event found:', treasureEvent.item_name);
    
    // Проверяем, не истек ли срок события
    if (!treasureEvent.ended_at || new Date(treasureEvent.ended_at) > new Date()) {
      // Для каждого убитого монстра проверяем дроп treasure hunt предмета
      for (const monster of killedMonsters) {
        const cleanMonsterName = monster.monster_name.replace(/\s*\(Lv\d+\)\s*$/i, '').trim();
        const monsterIdLower = treasureEvent.monster_id?.toLowerCase() || '';
        const cleanNameLower = cleanMonsterName.toLowerCase();
        
        const matchesMonster = !treasureEvent.monster_id || 
                              cleanNameLower.includes(monsterIdLower) ||
                              monsterIdLower.includes(cleanNameLower);
        
        if (matchesMonster) {
          // 🔒 Atomic check: UPDATE with WHERE to prevent race condition
          const { data: updatedEvent, error: updateError } = await supabase
            .from('treasure_hunt_events')
            .update({ found_quantity: treasureEvent.found_quantity + 1 })
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
              .update({ found_quantity: treasureEvent.found_quantity })
              .eq('id', treasureEvent.id);
          }
        }
      }
    }
  }

  console.log(`🎉 Total items calculated: ${items.length}`);

  return {
    ell_reward,
    experience_reward,
    items
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
      return json({ error: 'Invalid request' }, 400);
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
      await supabase
        .from('security_audit_log')
        .insert({
          event_type: 'INVALID_NONCE',
          wallet_address: null,
          claim_key: claimBody.claim_key,
          details: { nonce: claimBody.nonce, error: 'Nonce not found' }
        });
      return json({ error: 'Invalid nonce' }, 401);
    }

    // Check if nonce already used
    if (nonceData.used_at) {
      console.error('❌ [claim-battle-rewards] Nonce already used');
      await supabase
        .from('security_audit_log')
        .insert({
          event_type: 'INVALID_NONCE',
          wallet_address: nonceData.wallet_address,
          claim_key: claimBody.claim_key,
          details: { nonce: claimBody.nonce, error: 'Nonce already used' }
        });
      return json({ error: 'Nonce already used' }, 401);
    }

    // Check if nonce expired (5 minutes)
    const nonceAge = Date.now() - new Date(nonceData.created_at).getTime();
    if (nonceAge > 5 * 60 * 1000) {
      console.error('❌ [claim-battle-rewards] Nonce expired');
      await supabase
        .from('claim_nonces')
        .delete()
        .eq('nonce', claimBody.nonce);
      
      await supabase
        .from('security_audit_log')
        .insert({
          event_type: 'INVALID_NONCE',
          wallet_address: nonceData.wallet_address,
          claim_key: claimBody.claim_key,
          details: { nonce: claimBody.nonce, error: 'Nonce expired', age_ms: nonceAge }
        });
      return json({ error: 'Nonce expired' }, 401);
    }

    console.log('✅ [claim-battle-rewards] Nonce validated');

    // ============ SECURITY LAYER 2: RATE LIMITING ============
    console.log('⏱️ [claim-battle-rewards] Checking rate limit...');
    
    const { data: rateLimitOk } = await supabase
      .rpc('check_claim_rate_limit', {
        p_wallet_address: nonceData.wallet_address,
        p_max_claims_per_minute: 10
      });

    if (!rateLimitOk) {
      console.error('❌ [claim-battle-rewards] Rate limit exceeded');
      await supabase
        .from('security_audit_log')
        .insert({
          event_type: 'RATE_LIMITED',
          wallet_address: nonceData.wallet_address,
          claim_key: claimBody.claim_key,
          details: { message: 'Too many claim attempts' }
        });
      return json({ error: 'Too many claim attempts, please wait' }, 429);
    }

    console.log('✅ [claim-battle-rewards] Rate limit check passed');

    // ============ SECURITY LAYER 3: SESSION VALIDATION ============
    console.log('🔍 [claim-battle-rewards] Looking up session by claim_key:', claimBody.claim_key);
    
    const { data: session, error: sessionError } = await supabase
      .from('active_dungeon_sessions')
      .select('account_id, dungeon_type, level')
      .eq('claim_key', claimBody.claim_key)
      .single();

    if (sessionError || !session) {
      console.error('❌ Invalid or expired claim key:', sessionError);
      
      await supabase.from('security_audit_log').insert({
        event_type: 'INVALID_SESSION',
        wallet_address: nonceData.wallet_address,
        claim_key: claimBody.claim_key,
        details: { error: 'Session not found or expired', dungeon_type: claimBody.dungeon_type }
      }).then(null, () => {});
      
      return json({ error: 'Invalid or expired claim key' }, 403);
    }

    const wallet_address = session.account_id;

    // Verify nonce wallet matches session wallet
    if (nonceData.wallet_address !== wallet_address) {
      console.error('❌ Wallet mismatch:', { nonce_wallet: nonceData.wallet_address, session_wallet: wallet_address });
      await supabase
        .from('security_audit_log')
        .insert({
          event_type: 'INVALID_SESSION',
          wallet_address: nonceData.wallet_address,
          claim_key: claimBody.claim_key,
          details: { error: 'Wallet address mismatch' }
        });
      return json({ error: 'Invalid session' }, 401);
    }

    // Verify nonce session_id matches claim_key
    if (nonceData.session_id !== claimBody.claim_key) {
      console.error('❌ Session ID mismatch');
      await supabase
        .from('security_audit_log')
        .insert({
          event_type: 'INVALID_NONCE',
          wallet_address: wallet_address,
          claim_key: claimBody.claim_key,
          details: { error: 'Nonce does not belong to this session' }
        });
      return json({ error: 'Invalid nonce for session' }, 401);
    }

    // Проверяем соответствие dungeon_type
    if (session.dungeon_type !== claimBody.dungeon_type) {
      console.error('❌ Dungeon type mismatch:', {
        expected: session.dungeon_type,
        received: claimBody.dungeon_type
      });
      
      await supabase.from('security_audit_log').insert({
        event_type: 'DUNGEON_TYPE_MISMATCH',
        wallet_address,
        claim_key: claimBody.claim_key,
        details: { expected: session.dungeon_type, received: claimBody.dungeon_type }
      }).then(null, () => {});
      
      return json({ error: 'Dungeon type mismatch' }, 403);
    }

    // Cross-validate claimed level against session level
    // ✅ Разрешаем claimed level <= session level (race condition при быстром нажатии)
    if (claimBody.level > session.level) {
      console.error('❌ Level mismatch (claimed > session):', {
        session_level: session.level,
        claimed_level: claimBody.level
      });
      
      await supabase.from('security_audit_log').insert({
        event_type: 'LEVEL_MISMATCH',
        wallet_address,
        claim_key: claimBody.claim_key,
        details: { expected: session.level, received: claimBody.level }
      }).then(null, () => {});
      
      return json({ error: `Level mismatch: claimed ${claimBody.level} but session has ${session.level}` }, 403);
    }
    
    // Используем уровень из сессии как более надёжный источник
    const effectiveLevel = session.level;
    console.log('📊 Level check passed:', { claimed: claimBody.level, session: session.level, effective: effectiveLevel });

    console.log('✅ Session validated:', {
      wallet: wallet_address.substring(0, 10),
      dungeon: session.dungeon_type,
      level: session.level
    });

    // Проверка идемпотентности
    const { data: existingClaim } = await supabase
      .from('reward_claims')
      .select('id')
      .eq('claim_key', claimBody.claim_key)
      .maybeSingle();

    if (existingClaim) {
      console.log('⚠️ Claim already processed:', claimBody.claim_key);
      
      await supabase.from('security_audit_log').insert({
        event_type: 'ALREADY_CLAIMED',
        wallet_address,
        claim_key: claimBody.claim_key,
        details: { message: 'Attempted to claim already processed rewards' }
      }).then(null, () => {});
      
      return json({ success: true, message: 'Reward already claimed', duplicate: true });
    }

    // Вставляем запись в reward_claims
    const { error: insertClaimError } = await supabase
      .from('reward_claims')
      .insert({
        wallet_address,
        claim_key: claimBody.claim_key
      });

    if (insertClaimError) {
      console.error('❌ Error inserting claim:', insertClaimError);
      return json({ error: 'Failed to record claim' }, 500);
    }

    console.log('✅ Idempotency record created');

    // 🎯 СЕРВЕРНЫЙ РАСЧЕТ НАГРАД
    // Определяем dungeon_number по типу
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
    const { ell_reward, experience_reward, items } = await calculateRewards(
      supabase,
      claimBody.dungeon_type,
      claimBody.level,
      dungeonNumber,
      claimBody.killed_monsters
    );

    console.log('💎 Server-calculated rewards:', {
      ell_reward,
      experience_reward,
      items: items.length
    });

    // Server-side ELL cap: max reasonable ELL = level * 300 monsters * max formula
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

    // Вызываем RPC функцию для атомарного применения всех наград
    console.log('🎯 Calling apply_battle_rewards RPC');
    
    const { data: rpcResult, error: rpcError } = await supabase.rpc('apply_battle_rewards', {
      p_wallet_address: wallet_address,
      p_ell_reward: ell_reward,
      p_experience_reward: experience_reward,
      p_items: items,
      p_card_kills: claimBody.card_kills,
      p_card_health_updates: claimBody.card_health_updates
    });

    if (rpcError) {
      console.error('❌ RPC error:', rpcError);
      return json({ error: 'Failed to apply battle rewards' }, 500);
    }

    // Обновляем treasure hunt findings для дропнутых предметов события
    for (const item of items) {
      if (item.isTreasureHunt && item.treasureHuntEventId) {
        const { data: existingFinding } = await supabase
          .from('treasure_hunt_findings')
          .select('*')
          .eq('event_id', item.treasureHuntEventId)
          .eq('wallet_address', wallet_address)
          .maybeSingle();
        
        if (existingFinding) {
          await supabase
            .from('treasure_hunt_findings')
            .update({ 
              found_quantity: existingFinding.found_quantity + 1,
              found_at: new Date().toISOString()
            })
            .eq('id', existingFinding.id);
        } else {
          await supabase
            .from('treasure_hunt_findings')
            .insert({
              event_id: item.treasureHuntEventId,
              wallet_address,
              found_quantity: 1
            });
        }
      }
    }

    // ✅ ОБНОВЛЕНИЕ ПРОГРЕССА ЕЖЕДНЕВНЫХ/НЕДЕЛЬНЫХ ЗАДАНИЙ
    console.log('📋 [claim-battle-rewards] Updating quest progress...');
    const monstersKilledCount = claimBody.killed_monsters.length;
    
    try {
      // Обновляем квесты на убийство монстров
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
      
      // Обновляем квест на прохождение подземелья
      await supabase.rpc('update_daily_quest_progress', {
        p_wallet_address: wallet_address,
        p_quest_key: 'complete_dungeon_1',
        p_increment: 1
      });
      
      console.log('✅ [claim-battle-rewards] Quest progress updated:', {
        monsters: monstersKilledCount,
        dungeon_completion: 1
      });
    } catch (questError) {
      // Не блокируем основной flow из-за ошибки квестов
      console.error('⚠️ [claim-battle-rewards] Failed to update quest progress:', questError);
    }

    // Mark nonce as used
    await supabase
      .from('claim_nonces')
      .update({ used_at: new Date().toISOString() })
      .eq('nonce', claimBody.nonce);

    // Удаляем сессию после успешного клейма
    await supabase
      .from('active_dungeon_sessions')
      .delete()
      .eq('claim_key', claimBody.claim_key);

    console.log('✅ Rewards applied successfully:', {
      wallet: wallet_address.substring(0, 10),
      ell: ell_reward,
      exp: experience_reward,
      items: items.length
    });

    // Log successful claim
    await supabase
      .from('security_audit_log')
      .insert({
        event_type: 'CLAIM_SUCCESS',
        wallet_address: wallet_address,
        claim_key: claimBody.claim_key,
        details: {
          ell_reward,
          experience_reward,
          items_count: items.length,
          level: claimBody.level,
          dungeon_type: claimBody.dungeon_type
        }
      });

    return json({
      success: true,
      message: 'Battle rewards claimed successfully',
      results: rpcResult,
      rewards: {
        ell_reward,
        experience_reward,
        items: items // ✅ Возвращаем массив предметов, а не количество
      }
    });

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    
    // Log critical error
    try {
      const supabase = getSupabaseServiceClient();
      await supabase
        .from('security_audit_log')
        .insert({
          event_type: 'CRITICAL_ERROR',
          claim_key: null,
          details: { 
            error: error.message, 
            stack: error.stack,
            name: error.name 
          }
        });
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
    
    return json({ error: 'Internal server error' }, 500);
  }
});
