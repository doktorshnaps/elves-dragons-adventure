// deno-lint-ignore-file no-explicit-any
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
    const body = (await req.json()) as ClaimBody;
    const { wallet_address, claim_key } = body || ({} as ClaimBody);
    const items = Array.isArray(body?.items) ? body!.items : [];

    if (!wallet_address || !claim_key) {
      return json({ error: 'wallet_address and claim_key are required' }, { status: 400 });
    }

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
      return json({ error: 'failed to register claim', details: insertErr }, { status: 500 });
    }

    // Handle treasure hunt findings if provided
    const treasure_hunt_event_id = body?.treasure_hunt_event_id;
    const treasure_hunt_quantity = body?.treasure_hunt_quantity || 1;
    
    if (treasure_hunt_event_id) {
      console.log('[claim-item-reward] processing treasure hunt finding', { event_id: treasure_hunt_event_id, quantity: treasure_hunt_quantity });
      
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
          console.error('[claim-item-reward] failed to update treasure hunt finding', updateErr);
        } else {
          console.log('[claim-item-reward] treasure hunt finding updated');
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
          console.error('[claim-item-reward] failed to insert treasure hunt finding', insertFindingErr);
        } else {
          console.log('[claim-item-reward] treasure hunt finding created');
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
        return json({ error: 'failed to add items', details: error }, { status: 500 });
      }
      added = Number(data || 0);
    }

    console.log('[claim-item-reward] success', { added, wallet_address });
    return json({ status: 'ok', added, claim_key });
  } catch (e) {
    console.error('[claim-item-reward] unhandled error', e);
    return json({ error: 'unhandled', message: String(e?.message || e) }, { status: 500 });
  }
});
