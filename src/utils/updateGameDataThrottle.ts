// Centralized, throttled RPC caller for update_game_data_by_wallet
// Debounces and de-duplicates payloads per wallet to prevent request storms

import { supabase } from '@/integrations/supabase/client';

// Utility: stable stringify with sorted keys, skipping null/undefined to avoid noise
function stableStringify(value: any): string {
  const seen = new WeakSet();
  const stringify = (v: any): any => {
    if (v === null || v === undefined) return undefined; // skip nulls for hashing
    if (typeof v !== 'object') return v;
    if (seen.has(v)) return undefined;
    seen.add(v);
    if (Array.isArray(v)) return v.map(stringify);
    const keys = Object.keys(v).sort();
    const out: Record<string, any> = {};
    for (const k of keys) {
      const sv = stringify(v[k]);
      if (sv !== undefined) out[k] = sv;
    }
    return out;
  };
  try {
    return JSON.stringify(stringify(value));
  } catch {
    return Math.random().toString(36);
  }
}

// Merge helper: only merge fields with non-null/undefined values
function mergePayload(base: Record<string, any>, next: Record<string, any>) {
  const out = { ...base } as Record<string, any>;
  for (const [k, v] of Object.entries(next)) {
    if (k === 'p_wallet_address') { out[k] = v; continue; }
    if (v !== null && v !== undefined) {
      out[k] = v;
    }
  }
  return out;
}

interface QueueState {
  pending: Record<string, any> | null;
  timer: number | null;
  lastHash: string | null;
  inflight: Promise<boolean> | null;
  resolvers: Array<(v: boolean) => void>;
}

const queues = new Map<string, QueueState>();
const DEBOUNCE_MS = 600; // enough to collapse bursts

export async function updateGameDataByWalletThrottled(payload: Record<string, any>): Promise<boolean> {
  const wallet = payload.p_wallet_address as string;
  if (!wallet) throw new Error('p_wallet_address is required');

  let q = queues.get(wallet);
  if (!q) {
    q = { pending: null, timer: null, lastHash: null, inflight: null, resolvers: [] };
    queues.set(wallet, q);
  }

  // Merge into pending (ignore nulls)
  q.pending = mergePayload(q.pending ?? { p_wallet_address: wallet }, payload);

  // Compute hash and short-circuit if identical to last sent
  const nextHash = stableStringify(q.pending);
  if (q.lastHash && q.lastHash === nextHash && !q.inflight) {
    return true; // nothing new to send
  }

  // Return a promise that resolves when this batch flushes
  const p = new Promise<boolean>((resolve) => q!.resolvers.push(resolve));

  // (Re)schedule flush
  if (q.timer !== null) {
    clearTimeout(q.timer);
  }
  q.timer = setTimeout(async () => {
    if (!q) return;
    const toSend = q.pending;
    q.pending = null;
    q.timer = null;

    if (!toSend) {
      // Resolve any waiters
      const rs = q.resolvers.splice(0, q.resolvers.length);
      rs.forEach((r) => r(true));
      return;
    }

    // Execute single RPC call
    const exec = async () => {
      // Only include provided keys (avoid forcing nulls)
      const args: Record<string, any> = {};
      for (const [k, v] of Object.entries(toSend)) {
        if (v !== undefined) args[k] = v; // keep nulls if explicitly set
      }
      const { data, error } = await supabase.rpc('update_game_data_by_wallet', args as any);
      if (error) throw error;
      return data === true;
    };

    q.inflight = exec()
      .then((ok) => {
        q!.lastHash = stableStringify(toSend);
        const rs = q!.resolvers.splice(0, q!.resolvers.length);
        rs.forEach((r) => r(ok));
        return ok;
      })
      .catch((err) => {
        console.error('update_game_data_by_wallet throttled RPC failed:', err);
        const rs = q!.resolvers.splice(0, q!.resolvers.length);
        rs.forEach((r) => r(false));
        return false;
      })
      .finally(() => {
        q!.inflight = null;
      });

    await q.inflight;
  }, DEBOUNCE_MS) as unknown as number;

  return p;
}
