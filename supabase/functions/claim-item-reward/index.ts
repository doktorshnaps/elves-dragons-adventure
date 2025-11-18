// deno-lint-ignore-file no-explicit-any
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Comprehensive input validation schema
const ItemInputSchema = z.object({
  name: z.string().max(100).nullable().optional(),
  type: z.string().max(50).nullable().optional(),
  template_id: z.union([z.string(), z.number()]).nullable().optional(),
  item_id: z.string().max(100).nullable().optional(),
});

const ClaimBodySchema = z.object({
  wallet_address: z.string()
    .min(1, 'wallet_address cannot be empty')
    .max(64, 'wallet_address too long')
    .regex(/^[a-zA-Z0-9._-]+$/, 'Invalid wallet address format'),
  claim_key: z.string()
    .min(1, 'claim_key cannot be empty')
    .max(256, 'claim_key too long'),
  items: z.array(ItemInputSchema).max(100, 'Too many items').optional(),
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
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
}

interface ItemInput {
  name?: string | null;
  type?: string | null;
  template_id?: string | number | null;
  item_id?: string | null;
}

interface ClaimBody {
  wallet_address: string;
  claim_key: string;
  items?: ItemInput[];
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

    const { wallet_address, claim_key } = validation.data;
    const items = validation.data.items || [];

    // Normalize items: keep only supported fields; default type to material
    const normItems = items.map((it) => ({
      name: it.name ?? null,
      type: it.type ?? 'material',
      template_id: it.template_id ? String(it.template_id) : null,
      item_id: it.item_id ?? null,
    }));

    // Idempotency: insert claim row with unique constraint on claim_key
    console.log('[claim-item-reward] attempting claim', { wallet_address, claim_key, count: normItems.length });
    const { error: insertErr } = await supabase
      .from('reward_claims')
      .insert({ wallet_address, claim_key })
      .select('id')
      .single();

    if (insertErr) {
      // Unique violation => already claimed
      const code = (insertErr as any)?.code || (insertErr as any)?.details || '';
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
      console.log('[claim-item-reward] processing treasure hunt finding', { event_id: treasure_hunt_event_id, quantity: treasure_hunt_quantity });
      
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
      
      // Check if event is active
      if (!event.is_active) {
        console.log('[claim-item-reward] event is not active');
        return json({ status: 'skipped', reason: 'event_inactive' });
      }
      
      // Check if event has expired
      if (event.ended_at && new Date(event.ended_at) <= new Date()) {
        console.log('[claim-item-reward] event has expired', { ended_at: event.ended_at });
        return json({ status: 'skipped', reason: 'event_expired' });
      }
      
      // Check if finding already exists
      const { data: existingFinding } = await supabase
        .from('treasure_hunt_findings')
        .select('*')
        .eq('event_id', treasure_hunt_event_id)
        .eq('wallet_address', wallet_address)
        .maybeSingle();
      
      if (existingFinding) {
        // Update existing finding
        const { error: updateErr } = await supabase
          .from('treasure_hunt_findings')
          .update({ 
            found_quantity: existingFinding.found_quantity + treasure_hunt_quantity,
            found_at: new Date().toISOString()
          })
          .eq('id', existingFinding.id);
        
        if (updateErr) {
          console.error('[claim-item-reward] error updating treasure hunt finding', updateErr);
          return json({ error: 'Unable to update progress', code: 'UPDATE_ERROR' }, { status: 500 });
        }
      } else {
        // Create new finding
        const { error: insertFindingErr } = await supabase
          .from('treasure_hunt_findings')
          .insert({
            event_id: treasure_hunt_event_id,
            wallet_address,
            found_quantity: treasure_hunt_quantity
          });
        
        if (insertFindingErr) {
          console.error('[claim-item-reward] error inserting treasure hunt finding', insertFindingErr);
          return json({ error: 'Unable to record finding', code: 'RECORD_ERROR' }, { status: 500 });
        }
      }
    }

    // If there are items, call existing RPC to add to item_instances (bypasses RLS)
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

    console.log('[claim-item-reward] success', { added, wallet_address });
    return json({ status: 'ok', added, claim_key });
  } catch (e) {
    console.error('[claim-item-reward] unhandled error', e);
    return json({ error: 'Internal server error', code: 'SERVER_ERROR' }, { status: 500 });
  }
});
