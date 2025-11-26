// deno-lint-ignore-file no-explicit-any
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// 🔒 КРИТИЧЕСКИ ВАЖНО: wallet_address УБРАН из схемы - берётся из сессии!
const ItemInputSchema = z.object({
  name: z.string().max(100).nullable().optional(),
  type: z.string().max(50).nullable().optional(),
  template_id: z.union([z.string(), z.number()]).nullable().optional(),
  item_id: z.string().max(100).nullable().optional(),
});

const ClaimBodySchema = z.object({
  claim_key: z.string().uuid('Invalid claim_key format'), // Только claim_key!
  items: z.array(ItemInputSchema).max(1000, 'Too many items').optional(),
  treasure_hunt_event_id: z.string().uuid('Invalid event ID').optional(),
  treasure_hunt_quantity: z.number().int().min(1).max(10000).optional(),
});

function json(body: any, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
    ...init,
  });
}

function getSupabaseServiceClient() {
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing Supabase environment variables');
  }
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
}

interface ClaimBody {
  claim_key: string;
  items?: any[];
  treasure_hunt_event_id?: string;
  treasure_hunt_quantity?: number;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabase = getSupabaseServiceClient();
    let body: any;
    
    try {
      body = await req.json();
    } catch {
      return json({ error: 'Invalid request format' }, { status: 400 });
    }

    console.log('📦 [claim-item-reward] Received request with claim_key:', body.claim_key?.substring(0, 8));

    // Валидация с Zod
    const validation = ClaimBodySchema.safeParse(body);
    if (!validation.success) {
      console.error('[claim-item-reward] Validation error:', validation.error.issues);
      return json({ error: 'Invalid request' }, { status: 400 });
    }

    const claimBody: ClaimBody = validation.data;
    const items = claimBody.items || [];

    // 🔒 КРИТИЧЕСКАЯ ПРОВЕРКА: Извлекаем wallet из сессии БД, НЕ из запроса!
    console.log('🔍 [claim-item-reward] Looking up session by claim_key:', claimBody.claim_key);
    
    const { data: session, error: sessionError } = await supabase
      .from('active_dungeon_sessions')
      .select('account_id, dungeon_type')
      .eq('claim_key', claimBody.claim_key)
      .single();

    if (sessionError || !session) {
      console.error('❌ [claim-item-reward] Invalid or expired claim key:', sessionError);
      
      // Логируем подозрительную активность
      await supabase.from('security_audit_log').insert({
        event_type: 'invalid_claim_key',
        claim_key: claimBody.claim_key,
        details: { error: 'Session not found or expired', function: 'claim-item-reward' }
      }).then(null, () => {}); // Игнорируем ошибки логирования
      
      return json({ error: 'Invalid or expired claim key' }, { status: 403 });
    }

    // Wallet address берём из сессии, НЕ из запроса!
    const wallet_address = session.account_id;

    console.log('✅ [claim-item-reward] Session validated:', {
      wallet: wallet_address.substring(0, 10),
      dungeon: session.dungeon_type
    });

    // Normalize items: keep only supported fields; default type to material
    const normItems = items.map((it) => ({
      name: it.name ?? null,
      type: it.type ?? 'material',
      template_id: it.template_id ? String(it.template_id) : null,
      item_id: it.item_id ?? null,
    }));

    // Идемпотентность: проверяем, не был ли уже выполнен claim
    console.log('[claim-item-reward] Checking for duplicate claim');
    const { data: existingClaim, error: claimCheckError } = await supabase
      .from('reward_claims')
      .select('id')
      .eq('claim_key', claimBody.claim_key)
      .maybeSingle();

    if (claimCheckError) {
      console.error('❌ [claim-item-reward] Error checking claim:', claimCheckError);
      return json({ error: 'Database error' }, { status: 500 });
    }

    if (existingClaim) {
      console.warn('[claim-item-reward] Duplicate claim blocked:', claimBody.claim_key);
      
      await supabase.from('security_audit_log').insert({
        event_type: 'duplicate_claim_attempt',
        wallet_address,
        claim_key: claimBody.claim_key,
        details: { message: 'Attempted to claim already processed item rewards' }
      }).then(null, () => {});
      
      return json({ status: 'skipped', reason: 'duplicate', claim_key: claimBody.claim_key });
    }

    // Вставляем запись в reward_claims для идемпотентности
    const { error: insertClaimError } = await supabase
      .from('reward_claims')
      .insert({
        wallet_address: wallet_address, // Из сессии!
        claim_key: claimBody.claim_key
      });

    if (insertClaimError) {
      console.error('❌ [claim-item-reward] Error inserting claim:', insertClaimError);
      return json({ error: 'Failed to record claim' }, { status: 500 });
    }

    console.log('✅ [claim-item-reward] Idempotency record created');

    // Обработка treasure hunt findings если указан event_id
    const treasure_hunt_event_id = claimBody.treasure_hunt_event_id;
    const treasure_hunt_quantity = claimBody.treasure_hunt_quantity || 1;
    
    if (treasure_hunt_event_id) {
      console.log('[claim-item-reward] Processing treasure hunt finding', { 
        event_id: treasure_hunt_event_id, 
        quantity: treasure_hunt_quantity 
      });
      
      // Проверяем активность события
      const { data: event, error: eventErr } = await supabase
        .from('treasure_hunt_events')
        .select('*')
        .eq('id', treasure_hunt_event_id)
        .maybeSingle();
      
      if (eventErr || !event) {
        console.error('[claim-item-reward] Event not found', eventErr);
        return json({ error: 'Event not found' }, { status: 404 });
      }
      
      if (!event.is_active) {
        console.log('[claim-item-reward] Event is not active');
        return json({ status: 'skipped', reason: 'event_inactive' });
      }
      
      if (event.ended_at && new Date(event.ended_at) <= new Date()) {
        console.log('[claim-item-reward] Event has expired', { ended_at: event.ended_at });
        return json({ status: 'skipped', reason: 'event_expired' });
      }
      
      // Проверяем существующие находки
      const { data: existingFinding } = await supabase
        .from('treasure_hunt_findings')
        .select('*')
        .eq('event_id', treasure_hunt_event_id)
        .eq('wallet_address', wallet_address)
        .maybeSingle();
      
      if (existingFinding) {
        // Обновляем существующую находку
        const { error: updateErr } = await supabase
          .from('treasure_hunt_findings')
          .update({ 
            found_quantity: existingFinding.found_quantity + treasure_hunt_quantity,
            found_at: new Date().toISOString()
          })
          .eq('id', existingFinding.id);
        
        if (updateErr) {
          console.error('[claim-item-reward] Error updating treasure hunt finding', updateErr);
          return json({ error: 'Unable to update progress' }, { status: 500 });
        }
      } else {
        // Создаем новую находку
        const { error: insertFindingErr } = await supabase
          .from('treasure_hunt_findings')
          .insert({
            event_id: treasure_hunt_event_id,
            wallet_address,
            found_quantity: treasure_hunt_quantity
          });
        
        if (insertFindingErr) {
          console.error('[claim-item-reward] Error inserting treasure hunt finding', insertFindingErr);
          return json({ error: 'Unable to record finding' }, { status: 500 });
        }
      }
    }

    // Добавляем предметы в инвентарь через RPC (обходит RLS)
    let added = 0;
    if (normItems.length > 0) {
      const { data, error } = await supabase.rpc('add_item_instances', {
        p_wallet_address: wallet_address, // Из сессии!
        p_items: normItems,
      });
      if (error) {
        console.error('[claim-item-reward] add_item_instances RPC error', error);
        return json({ error: 'Unable to process items' }, { status: 500 });
      }
      added = Number(data || 0);
    }

    console.log('✅ [claim-item-reward] Success:', { 
      added, 
      wallet: wallet_address.substring(0, 10),
      claim_key: claimBody.claim_key 
    });
    
    return json({ status: 'ok', added, claim_key: claimBody.claim_key });
    
  } catch (e) {
    console.error('[claim-item-reward] Unhandled error', e);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
});
