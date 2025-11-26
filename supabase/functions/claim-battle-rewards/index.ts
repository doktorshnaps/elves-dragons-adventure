import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Схема для валидации данных предмета
const ItemSchema = z.object({
  template_id: z.number(),
  item_id: z.string(),
  name: z.string(),
  type: z.string(),
  quantity: z.number().default(1)
});

// Схема для валидации данных убийства карточками
const CardKillSchema = z.object({
  card_template_id: z.string(),
  kills: z.number().min(1)
});

// 🔒 НОВОЕ: Клиент больше НЕ передаёт награды - они рассчитываются на сервере!
const ClaimBodySchema = z.object({
  claim_key: z.string().uuid(), // Только claim_key - wallet берём из сессии!
  dungeon_type: z.string(),
  level: z.number().min(1),
  
  // 🎯 Server-side calculation: клиент передаёт только факты убийств
  monsters_killed: z.number().min(0), // Количество убитых монстров
  
  // Предметы теперь ОПЦИОНАЛЬНЫ - клиент может передать, сервер валидирует
  items: z.array(ItemSchema).optional(),
  
  card_kills: z.array(CardKillSchema),
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

// 🎯 Server-side reward calculation
const calculateRewards = async (
  supabase: any,
  dungeonType: string,
  level: number,
  monstersKilled: number
) => {
  console.log('🧮 [calculateRewards] Starting server-side calculation:', {
    dungeonType,
    level,
    monstersKilled
  });

  // Получаем настройки подземелья из БД
  const { data: dungeonSettings, error: settingsError } = await supabase
    .from('dungeon_settings')
    .select('*')
    .eq('dungeon_type', dungeonType)
    .single();

  if (settingsError || !dungeonSettings) {
    console.error('❌ [calculateRewards] Dungeon settings not found:', settingsError);
    // Используем дефолтные значения, если настройки не найдены
    return {
      ell_reward: Math.floor(monstersKilled * 5 * (1 + level * 0.1)),
      experience_reward: Math.floor(monstersKilled * 10 * (1 + level * 0.15))
    };
  }

  // 🎯 Формула расчёта наград:
  // Базовые награды зависят от уровня подземелья и количества убитых монстров
  // ELL = monstersKilled * (5 + level * 0.5)
  // EXP = monstersKilled * (10 + level * 1.0)
  
  const baseEllPerMonster = 5;
  const baseExpPerMonster = 10;
  const ellLevelBonus = level * 0.5;
  const expLevelBonus = level * 1.0;

  const ellPerMonster = baseEllPerMonster + ellLevelBonus;
  const expPerMonster = baseExpPerMonster + expLevelBonus;

  const ell_reward = Math.floor(monstersKilled * ellPerMonster);
  const experience_reward = Math.floor(monstersKilled * expPerMonster);

  console.log('✅ [calculateRewards] Server-calculated rewards:', {
    ell_reward,
    experience_reward,
    ellPerMonster,
    expPerMonster
  });

  return { ell_reward, experience_reward };
};

// 🎯 Server-side item validation
const validateItems = async (
  supabase: any,
  items: any[],
  dungeonType: string,
  level: number
): Promise<any[]> => {
  if (!items || items.length === 0) {
    return [];
  }

  console.log('🔍 [validateItems] Validating', items.length, 'items for dungeon:', dungeonType, 'level:', level);

  // Получаем dungeon_number из dungeon_settings
  const { data: dungeonSettings } = await supabase
    .from('dungeon_settings')
    .select('dungeon_number')
    .eq('dungeon_type', dungeonType)
    .single();

  if (!dungeonSettings) {
    console.warn('⚠️ [validateItems] Dungeon settings not found, rejecting all items');
    return [];
  }

  const dungeonNumber = dungeonSettings.dungeon_number;

  // Проверяем каждый предмет через dungeon_item_drops
  const validatedItems = [];
  
  for (const item of items) {
    const { data: dropSettings } = await supabase
      .from('dungeon_item_drops')
      .select('*')
      .eq('item_template_id', item.template_id)
      .eq('dungeon_number', dungeonNumber)
      .eq('is_active', true)
      .lte('min_dungeon_level', level)
      .or(`max_dungeon_level.is.null,max_dungeon_level.gte.${level}`)
      .maybeSingle();

    if (dropSettings) {
      console.log('✅ [validateItems] Item validated:', item.name, 'drop_chance:', dropSettings.drop_chance);
      validatedItems.push(item);
    } else {
      console.warn('⚠️ [validateItems] Item rejected (not in drop table):', item.name, 'template_id:', item.template_id);
      
      // Логируем подозрительную активность - предмет не должен был выпасть
      await supabase.from('security_audit_log').insert({
        event_type: 'invalid_item_drop',
        details: { 
          item_name: item.name,
          template_id: item.template_id,
          dungeon_type: dungeonType,
          level,
          reason: 'Item not found in dungeon_item_drops table'
        }
      }).then(null, () => {});
    }
  }

  console.log('✅ [validateItems] Validated items:', validatedItems.length, '/', items.length);
  return validatedItems;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log('📦 [claim-battle-rewards] Received request with claim_key:', body.claim_key?.substring(0, 8));

    // Валидация с подробными ошибками
    const parseResult = ClaimBodySchema.safeParse(body);
    if (!parseResult.success) {
      console.error('❌ [claim-battle-rewards] Validation error:', parseResult.error.errors);
      return json({ error: 'Invalid request' }, 400);
    }

    const claimBody: ClaimBody = parseResult.data;
    const supabase = getSupabaseServiceClient();

    // 🔒 КРИТИЧЕСКАЯ ПРОВЕРКА: Извлекаем wallet из сессии БД, НЕ из запроса!
    console.log('🔍 [claim-battle-rewards] Looking up session by claim_key:', claimBody.claim_key);
    
    const { data: session, error: sessionError } = await supabase
      .from('active_dungeon_sessions')
      .select('account_id, dungeon_type, level')
      .eq('claim_key', claimBody.claim_key)
      .single();

    if (sessionError || !session) {
      console.error('❌ [claim-battle-rewards] Invalid or expired claim key:', sessionError);
      
      // Логируем подозрительную активность
      await supabase.from('security_audit_log').insert({
        event_type: 'invalid_claim_key',
        claim_key: claimBody.claim_key,
        details: { error: 'Session not found or expired', dungeon_type: claimBody.dungeon_type }
      }).then(null, () => {}); // Игнорируем ошибки логирования
      
      return json({ error: 'Invalid or expired claim key' }, 403);
    }

    // Wallet address берём из сессии, НЕ из запроса!
    const wallet_address = session.account_id;

    // Проверяем соответствие dungeon_type
    if (session.dungeon_type !== claimBody.dungeon_type) {
      console.error('❌ [claim-battle-rewards] Dungeon type mismatch:', {
        expected: session.dungeon_type,
        received: claimBody.dungeon_type
      });
      
      await supabase.from('security_audit_log').insert({
        event_type: 'dungeon_type_mismatch',
        wallet_address,
        claim_key: claimBody.claim_key,
        details: { expected: session.dungeon_type, received: claimBody.dungeon_type }
      }).then(null, () => {});
      
      return json({ error: 'Dungeon type mismatch' }, 403);
    }

    console.log('✅ [claim-battle-rewards] Session validated:', {
      wallet: wallet_address.substring(0, 10),
      dungeon: session.dungeon_type,
      level: session.level
    });

    // 🎯 SERVER-SIDE REWARD CALCULATION
    const calculatedRewards = await calculateRewards(
      supabase,
      claimBody.dungeon_type,
      claimBody.level,
      claimBody.monsters_killed
    );

    console.log('💰 [claim-battle-rewards] Server-calculated rewards:', calculatedRewards);

    // 🎯 SERVER-SIDE ITEM VALIDATION
    const validatedItems = await validateItems(
      supabase,
      claimBody.items || [],
      claimBody.dungeon_type,
      claimBody.level
    );

    console.log('🔐 [claim-battle-rewards] Processing claim for wallet:', wallet_address.substring(0, 10), {
      ell: calculatedRewards.ell_reward,
      exp: calculatedRewards.experience_reward,
      monsters_killed: claimBody.monsters_killed,
      validated_items: validatedItems.length,
      rejected_items: (claimBody.items?.length || 0) - validatedItems.length,
      card_kills: claimBody.card_kills.length,
      card_health_updates: claimBody.card_health_updates.length
    });

    // Проверка идемпотентности через reward_claims
    const { data: existingClaim, error: claimCheckError } = await supabase
      .from('reward_claims')
      .select('id')
      .eq('claim_key', claimBody.claim_key)
      .maybeSingle();

    if (claimCheckError) {
      console.error('❌ [claim-battle-rewards] Error checking claim:', claimCheckError);
      return json({ error: 'Database error' }, 500);
    }

    if (existingClaim) {
      console.log('⚠️ [claim-battle-rewards] Claim already processed:', claimBody.claim_key);
      
      await supabase.from('security_audit_log').insert({
        event_type: 'duplicate_claim_attempt',
        wallet_address,
        claim_key: claimBody.claim_key,
        details: { message: 'Attempted to claim already processed rewards' }
      }).then(null, () => {});
      
      return json({ success: true, message: 'Reward already claimed', duplicate: true });
    }

    // Вставляем запись в reward_claims для идемпотентности
    const { error: insertClaimError } = await supabase
      .from('reward_claims')
      .insert({
        wallet_address: wallet_address, // Из сессии!
        claim_key: claimBody.claim_key
      });

    if (insertClaimError) {
      console.error('❌ [claim-battle-rewards] Error inserting claim:', insertClaimError);
      return json({ error: 'Failed to record claim' }, 500);
    }

    console.log('✅ [claim-battle-rewards] Idempotency record created');

    // Вызываем RPC функцию для атомарного применения всех наград
    console.log('🎯 [claim-battle-rewards] Calling apply_battle_rewards RPC');
    
    const { data: rpcResult, error: rpcError } = await supabase.rpc('apply_battle_rewards', {
      p_wallet_address: wallet_address, // Из сессии!
      p_ell_reward: calculatedRewards.ell_reward, // SERVER-CALCULATED!
      p_experience_reward: calculatedRewards.experience_reward, // SERVER-CALCULATED!
      p_items: validatedItems, // SERVER-VALIDATED!
      p_card_kills: claimBody.card_kills,
      p_card_health_updates: claimBody.card_health_updates
    });

    if (rpcError) {
      console.error('❌ [claim-battle-rewards] RPC error:', rpcError);
      return json({ error: 'Failed to apply battle rewards' }, 500);
    }

    // Удаляем сессию после успешного клейма
    const { error: deleteError } = await supabase
      .from('active_dungeon_sessions')
      .delete()
      .eq('claim_key', claimBody.claim_key);

    if (deleteError) {
      console.warn('⚠️ [claim-battle-rewards] Failed to delete session:', deleteError);
    }

    console.log('✅ [claim-battle-rewards] Rewards applied successfully:', {
      wallet: wallet_address.substring(0, 10),
      results: rpcResult,
      server_calculated: {
        ell: calculatedRewards.ell_reward,
        exp: calculatedRewards.experience_reward
      }
    });

    return json({
      success: true,
      message: 'Battle rewards claimed successfully',
      results: rpcResult,
      server_calculated: {
        ell_reward: calculatedRewards.ell_reward,
        experience_reward: calculatedRewards.experience_reward,
        items_validated: validatedItems.length,
        items_rejected: (claimBody.items?.length || 0) - validatedItems.length
      }
    });

  } catch (error) {
    console.error('❌ [claim-battle-rewards] Unexpected error:', error);
    return json({ error: 'Internal server error' }, 500);
  }
});
