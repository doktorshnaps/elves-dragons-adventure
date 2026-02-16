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

// Build p_updates JSONB object for update_game_data_by_wallet_v2 RPC
// The v2 RPC accepts (p_wallet_address text, p_updates jsonb, p_force boolean)
function buildRpcArgs(input: Record<string, any>): Record<string, any> {
  const camelToSnake: Record<string, string> = {
    balance: 'balance',
    cards: 'cards',
    selectedTeam: 'selected_team',
    dragonEggs: 'dragon_eggs',
    accountLevel: 'account_level',
    accountExperience: 'account_experience',
    initialized: 'initialized',
    marketplaceListings: 'marketplace_listings',
    socialQuests: 'social_quests',
    adventurePlayerStats: 'adventure_player_stats',
    adventureCurrentMonster: 'adventure_current_monster',
    battleState: 'battle_state',
    barracksUpgrades: 'barracks_upgrades',
    dragonLairUpgrades: 'dragon_lair_upgrades',
    activeWorkers: 'active_workers',
    buildingLevels: 'building_levels',
    activeBuildingUpgrades: 'active_building_upgrades',
    wood: 'wood',
    stone: 'stone',
    iron: 'iron',
    gold: 'gold',
    maxWood: 'max_wood',
    maxStone: 'max_stone',
    maxIron: 'max_iron',
    woodLastCollectionTime: 'wood_last_collection_time',
    stoneLastCollectionTime: 'stone_last_collection_time',
    woodProductionData: 'wood_production_data',
    stoneProductionData: 'stone_production_data',
  };

  const wallet = input.p_wallet_address;
  const force = input.p_force ?? false;
  const updates: Record<string, any> = {};

  for (const [k, v] of Object.entries(input)) {
    if (k === 'p_wallet_address' || k === 'p_force') continue;
    if (v === undefined) continue;

    // Handle p_* keys (already prefixed from legacy callers)
    if (k.startsWith('p_')) {
      if (k === 'p_inventory') continue; // strip deprecated
      const fieldName = k.substring(2); // remove p_ prefix
      updates[fieldName] = v;
    } else if (k === 'inventory') {
      continue; // strip deprecated
    } else {
      // Map camelCase to snake_case
      const snakeKey = camelToSnake[k];
      if (snakeKey) {
        updates[snakeKey] = v;
      }
    }
  }

  return {
    p_wallet_address: wallet,
    p_updates: updates,
    p_force: force,
  };
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

// Global sync freeze to prevent data loss during wallet switch/clear
const syncFreezeMap = new Map<string, number>(); // wallet -> freeze end timestamp
const FREEZE_DURATION_MS = 3000; // 3 seconds freeze after clear

export function setSyncFreeze(wallet: string, durationMs: number = FREEZE_DURATION_MS) {
  const freezeUntil = Date.now() + durationMs;
  syncFreezeMap.set(wallet, freezeUntil);
  console.log(`🔒 [throttler] Sync frozen for wallet ${wallet} until ${new Date(freezeUntil).toISOString()}`);
}

export function clearSyncFreeze(wallet: string) {
  syncFreezeMap.delete(wallet);
  console.log(`🔓 [throttler] Sync freeze cleared for wallet ${wallet}`);
}

function isSyncFrozen(wallet: string): boolean {
  const freezeUntil = syncFreezeMap.get(wallet);
  if (!freezeUntil) return false;
  
  const now = Date.now();
  if (now < freezeUntil) {
    console.log(`❄️ [throttler] Sync frozen for wallet ${wallet} (${Math.round((freezeUntil - now) / 1000)}s remaining)`);
    return true;
  }
  
  // Auto-cleanup expired freeze
  syncFreezeMap.delete(wallet);
  return false;
}

export async function updateGameDataByWalletThrottled(payload: Record<string, any>): Promise<boolean> {
  const wallet = payload.p_wallet_address as string;
  if (!wallet) throw new Error('p_wallet_address is required');

  // КРИТИЧНО: блокируем запись если активен freeze (защита от race condition при смене кошелька)
  if (isSyncFrozen(wallet)) {
    console.warn(`🚫 [throttler] Update blocked by sync freeze for wallet ${wallet}`);
    return true; // Возвращаем true чтобы не триггерить ошибки в UI
  }

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
    // Build safe args for stable RPC and strip deprecated fields
      const args = buildRpcArgs(toSend);
      
      const updateKeys = Object.keys(args.p_updates || {});

      // If no fields to update, skip RPC call
      if (updateKeys.length === 0) {
        console.log('ℹ️ [throttler] No fields to update; skipping RPC call');
        return true;
      }
      try {
        console.log('🔁 [throttler] Calling update_game_data_by_wallet_v2 with update keys:', Object.keys(args.p_updates || {}));
        const { data, error } = await supabase.rpc('update_game_data_by_wallet_v2', args as any);
        if (error) throw error;
        // v2 returns jsonb like { success: true, version: N, ... }
        const ok = typeof data === 'object' && data !== null && (data as any).success === true;
        if (!ok) {
          console.warn('⚠️ [throttler] RPC returned:', data);
        }
        return ok;
      } catch (err: any) {
        console.error('❌ [throttler] RPC error:', { code: err?.code, message: err?.message, hint: err?.hint, updateKeys: Object.keys(args.p_updates || {}) });
        // PGRST203 fallback: try sending fields one-by-one
        const failedKeys = Object.keys(args.p_updates || {});
        if (err?.code === 'PGRST203' && failedKeys.length > 0) {
          for (const k of updateKeys) {
            const narrowArgs = {
              p_wallet_address: args.p_wallet_address,
              p_updates: { [k]: (args.p_updates as any)[k] },
              p_force: args.p_force ?? false
            };
            try {
              console.log('🧪 [throttler] Retrying with narrow key:', k);
              const { data: d2, error: e2 } = await supabase.rpc('update_game_data_by_wallet_v2', narrowArgs as any);
              if (!e2 && typeof d2 === 'object' && d2 !== null && (d2 as any).success === true) {
                console.log('✅ [throttler] Narrow update succeeded with key:', k);
                return true;
              }
            } catch (e3) {
              console.warn('↪️ [throttler] Narrow attempt failed for key:', k, e3);
            }
          }
        }
        throw err;
      }
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
