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

// 🔒 КРИТИЧЕСКОЕ ИЗМЕНЕНИЕ: wallet_address УБРАН, берётся из сессии БД!
const ClaimBodySchema = z.object({
  claim_key: z.string().uuid(), // Только claim_key - wallet берём из сессии!
  dungeon_type: z.string(),
  level: z.number().min(1),
  ell_reward: z.number().min(0),
  experience_reward: z.number().min(0),
  items: z.array(ItemSchema),
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
      wallet: wallet_address,
      dungeon: session.dungeon_type,
      level: session.level
    });

    console.log('🔐 [claim-battle-rewards] Processing claim for wallet:', wallet_address.substring(0, 10), {
      ell: claimBody.ell_reward,
      exp: claimBody.experience_reward,
      items: claimBody.items.length,
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
      p_ell_reward: claimBody.ell_reward,
      p_experience_reward: claimBody.experience_reward,
      p_items: claimBody.items,
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
    });

    return json({
      success: true,
      message: 'Battle rewards claimed successfully',
      results: rpcResult
    });

  } catch (error) {
    console.error('❌ [claim-battle-rewards] Unexpected error:', error);
    return json({ error: 'Internal server error' }, 500);
  }
});
