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

// Основная схема тела запроса
const ClaimBodySchema = z.object({
  wallet_address: z.string().min(1),
  claim_key: z.string().min(1),
  dungeon_type: z.string(),
  level: z.number().min(1),
  ell_reward: z.number().min(0),
  experience_reward: z.number().min(0),
  items: z.array(ItemSchema),
  card_kills: z.array(CardKillSchema),
  card_health_updates: z.array(z.object({
    card_instance_id: z.string(), // ИСПРАВЛЕНО: используем card_instance_id вместо card_template_id
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
    console.log('📦 [claim-battle-rewards] Received request:', {
      wallet: body.wallet_address,
      claim_key: body.claim_key,
      level: body.level
    });

    // Валидация с подробными ошибками
    const parseResult = ClaimBodySchema.safeParse(body);
    if (!parseResult.success) {
      console.error('❌ [claim-battle-rewards] Validation error:', parseResult.error.errors);
      return json(
        { 
          error: 'Invalid request body',
          details: parseResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
        },
        400
      );
    }

    const data: ClaimBody = parseResult.data;
    const supabase = getSupabaseServiceClient();

    console.log('🔐 [claim-battle-rewards] Processing claim:', {
      wallet: data.wallet_address,
      claim_key: data.claim_key,
      ell: data.ell_reward,
      exp: data.experience_reward,
      items: data.items.length,
      card_kills: data.card_kills.length,
      card_health_updates: data.card_health_updates.length
    });
    
    // Детальное логирование обновлений здоровья карт
    if (data.card_health_updates.length > 0) {
      console.log('💔 [claim-battle-rewards] Card health updates received:', {
        totalUpdates: data.card_health_updates.length,
        updates: data.card_health_updates.map(u => ({
          instanceId: u.card_instance_id.substring(0, 8),
          health: u.current_health,
          defense: u.current_defense
        }))
      });
    } else {
      console.warn('⚠️ [claim-battle-rewards] No card health updates received!');
    }

    // Проверка идемпотентности через reward_claims
    const { data: existingClaim, error: claimCheckError } = await supabase
      .from('reward_claims')
      .select('id')
      .eq('claim_key', data.claim_key)
      .eq('wallet_address', data.wallet_address)
      .maybeSingle();

    if (claimCheckError) {
      console.error('❌ [claim-battle-rewards] Error checking claim:', claimCheckError);
      return json({ error: 'Database error during claim check' }, 500);
    }

    if (existingClaim) {
      console.log('⚠️ [claim-battle-rewards] Claim already processed:', data.claim_key);
      return json({ success: true, message: 'Reward already claimed', duplicate: true });
    }

    // Вставляем запись в reward_claims для идемпотентности
    const { error: insertClaimError } = await supabase
      .from('reward_claims')
      .insert({
        wallet_address: data.wallet_address,
        claim_key: data.claim_key
      });

    if (insertClaimError) {
      console.error('❌ [claim-battle-rewards] Error inserting claim:', insertClaimError);
      return json({ error: 'Database error during claim insertion' }, 500);
    }

    console.log('✅ [claim-battle-rewards] Idempotency record created');

    // Вызываем RPC функцию для атомарного применения всех наград
    console.log('🎯 [claim-battle-rewards] Calling apply_battle_rewards RPC with:', {
      wallet: data.wallet_address,
      ell: data.ell_reward,
      exp: data.experience_reward,
      itemsCount: data.items.length,
      cardKillsCount: data.card_kills.length,
      healthUpdatesCount: data.card_health_updates.length
    });
    
    const { data: rpcResult, error: rpcError } = await supabase.rpc('apply_battle_rewards', {
      p_wallet_address: data.wallet_address,
      p_ell_reward: data.ell_reward,
      p_experience_reward: data.experience_reward,
      p_items: data.items,
      p_card_kills: data.card_kills,
      p_card_health_updates: data.card_health_updates
    });

    if (rpcError) {
      console.error('❌ [claim-battle-rewards] RPC apply_battle_rewards error:', {
        code: rpcError.code,
        message: rpcError.message,
        details: rpcError.details,
        hint: rpcError.hint
      });
      return json({ error: 'Failed to apply battle rewards' }, 500);
    }

    console.log('✅ [claim-battle-rewards] RPC apply_battle_rewards successful:', rpcResult);

    return json({
      success: true,
      message: 'Battle rewards claimed successfully',
      results: rpcResult
    });

  } catch (error) {
    console.error('❌ [claim-battle-rewards] Unexpected error:', error);
    return json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      500
    );
  }
});
