import { createClient } from 'jsr:@supabase/supabase-js@2';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// 🔒 КРИТИЧЕСКОЕ ИЗМЕНЕНИЕ: убран wallet_address, используем claim_key
const ClaimBodySchema = z.object({
  claim_key: z.string().uuid('Invalid claim key format'),
  items: z.array(z.object({
    name: z.string().max(100).nullable().optional(),
    type: z.string().max(50).nullable().optional(),
    template_id: z.union([z.string(), z.number()]).nullable().optional(),
    item_id: z.string().max(100).nullable().optional(),
  })).max(1000, 'Too many items').optional(),
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

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabase = getSupabaseServiceClient();
    let body: any;
    
    try {
      body = await req.json();
    } catch {
      return json({ error: 'Invalid request format', code: 'INVALID_JSON' }, { status: 400 });
    }

    // Validate input with Zod
    const validation = ClaimBodySchema.safeParse(body);
    if (!validation.success) {
      console.error('[claim-item-reward] validation error:', validation.error.issues);
      return json({ 
        error: 'Invalid input data', 
        code: 'VALIDATION_ERROR',
        details: validation.error.issues.map(i => i.message)
      }, { status: 400 });
    }

    const { claim_key } = validation.data;
    const items = validation.data.items || [];

    console.log('[claim-item-reward] Processing claim with claim_key:', claim_key.substring(0, 8));

    // 🔒 КРИТИЧЕСКАЯ ПРОВЕРКА: Извлекаем wallet_address из сессии БД, НЕ из запроса!
    const { data: session, error: sessionError } = await supabase
      .from('active_dungeon_sessions')
      .select('account_id, dungeon_type')
      .eq('claim_key', claim_key)
      .single();

    if (sessionError || !session) {
      console.error('[claim-item-reward] Invalid or expired claim key:', sessionError);
      
      // Логируем подозрительную активность
      await supabase.from('security_audit_log').insert({
        event_type: 'invalid_claim_key_item',
        claim_key,
        details: { error: 'Session not found or expired' }
      }).then(null, () => {});
      
      return json({ error: 'Invalid or expired claim key', code: 'INVALID_CLAIM_KEY' }, { status: 403 });
    }

    // Wallet address берём из сессии, НЕ из запроса!
    const wallet_address = session.account_id;

    console.log('[claim-item-reward] Session validated for wallet:', wallet_address.substring(0, 10));

    // Normalize items
    const normItems = items.map((it) => ({
      name: it.name ?? null,
      type: it.type ?? 'material',
      template_id: it.template_id ? String(it.template_id) : null,
      item_id: it.item_id ?? null,
    }));

    // Idempotency: insert claim row with unique constraint on claim_key
    const { error: insertErr } = await supabase
      .from('reward_claims')
      .insert({ wallet_address, claim_key })
      .select('id')
      .single();

    if (insertErr) {
      const code = (insertErr as any)?.code || '';
      if (code === '23505' || String(insertErr.message || '').includes('duplicate key')) {
        console.warn('[claim-item-reward] duplicate claim blocked', { claim_key });
        return json({ status: 'skipped', reason: 'duplicate', claim_key });
      }
      console.error('[claim-item-reward] claim row insert error', insertErr);
      return json({ error: 'Unable to process claim', code: 'CLAIM_ERROR' }, { status: 500 });
    }

    // Handle treasure hunt findings if provided
    const treasure_hunt_event_id = validation.data.treasure_hunt_event_id;
    const treasure_hunt_quantity = validation.data.treasure_hunt_quantity || 1;
    
    if (treasure_hunt_event_id) {
      console.log('[claim-item-reward] processing treasure hunt finding', { 
        event_id: treasure_hunt_event_id, 
        quantity: treasure_hunt_quantity 
      });
      
      // Check if event is still active and not expired
      const { data: event, error: eventErr } = await supabase
        .from('treasure_hunt_events')
        .select('*')
        .eq('id', treasure_hunt_event_id)
        .maybeSingle();
      
      if (eventErr || !event) {
        console.error('[claim-item-reward] event not found', eventErr);
        return json({ error: 'Event not found', code: 'EVENT_NOT_FOUND' }, { status: 404 });
      }
      
      if (!event.is_active) {
        console.log('[claim-item-reward] event is not active');
        return json({ status: 'skipped', reason: 'event_inactive' });
      }
      
      if (event.ended_at && new Date(event.ended_at) <= new Date()) {
        console.log('[claim-item-reward] event has expired');
        return json({ status: 'skipped', reason: 'event_expired' });
      }
      
      // Update or create finding
      const { data: existingFinding } = await supabase
        .from('treasure_hunt_findings')
        .select('*')
        .eq('event_id', treasure_hunt_event_id)
        .eq('wallet_address', wallet_address)
        .maybeSingle();
      
      if (existingFinding) {
        await supabase
          .from('treasure_hunt_findings')
          .update({ 
            found_quantity: existingFinding.found_quantity + treasure_hunt_quantity,
            found_at: new Date().toISOString()
          })
          .eq('id', existingFinding.id);
      } else {
        await supabase
          .from('treasure_hunt_findings')
          .insert({
            event_id: treasure_hunt_event_id,
            wallet_address,
            found_quantity: treasure_hunt_quantity
          });
      }
    }

    // Add items to inventory via RPC (bypasses RLS)
    let added = 0;
    if (normItems.length > 0) {
      const { data, error } = await supabase.rpc('add_item_instances', {
        p_wallet_address: wallet_address,
        p_items: normItems,
      });
      if (error) {
        console.error('[claim-item-reward] add_item_instances RPC error', error);
        return json({ error: 'Unable to process items', code: 'ITEM_ERROR' }, { status: 500 });
      }
      added = Number(data || 0);
    }

    console.log('[claim-item-reward] success', { added, wallet_address: wallet_address.substring(0, 10) });
    return json({ status: 'ok', added, claim_key });
  } catch (e) {
    console.error('[claim-item-reward] unhandled error', e);
    return json({ error: 'Internal server error', code: 'SERVER_ERROR' }, { status: 500 });
  }
});
