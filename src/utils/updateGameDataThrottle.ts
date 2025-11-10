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

// Map camelCase state keys to RPC function parameter names (p_*)
function buildRpcArgs(input: Record<string, any>): Record<string, any> {
  const map: Record<string, string> = {
    // core
    p_wallet_address: 'p_wallet_address',
    balance: 'p_balance',
    cards: 'p_cards',
    selectedTeam: 'p_selected_team',
    dragonEggs: 'p_dragon_eggs',
    accountLevel: 'p_account_level',
    accountExperience: 'p_account_experience',
    initialized: 'p_initialized',
    marketplaceListings: 'p_marketplace_listings',
    socialQuests: 'p_social_quests',
    adventurePlayerStats: 'p_adventure_player_stats',
    adventureCurrentMonster: 'p_adventure_current_monster',
    battleState: 'p_battle_state',
    barracksUpgrades: 'p_barracks_upgrades',
    dragonLairUpgrades: 'p_dragon_lair_upgrades',
    activeWorkers: 'p_active_workers',
    buildingLevels: 'p_building_levels',
    activeBuildingUpgrades: 'p_active_building_upgrades',
    // resources
    wood: 'p_wood',
    stone: 'p_stone',
    iron: 'p_iron',
    gold: 'p_gold',
    maxWood: 'p_max_wood',
    maxStone: 'p_max_stone',
    maxIron: 'p_max_iron',
    woodLastCollectionTime: 'p_wood_last_collection_time',
    stoneLastCollectionTime: 'p_stone_last_collection_time',
    woodProductionData: 'p_wood_production_data',
    stoneProductionData: 'p_stone_production_data',
  };

  const out: Record<string, any> = {};

  // If caller already passed p_* keys, keep them (except deprecated ones)
  for (const [k, v] of Object.entries(input)) {
    if (k.startsWith('p_')) {
      if (k === 'p_inventory') continue; // strip deprecated
      if (v !== undefined) out[k] = v;
    }
  }

  // Map camelCase to p_* if not already present
  for (const [k, v] of Object.entries(input)) {
    if (k.startsWith('p_')) continue; // already handled
    if (k === 'inventory') continue; // strip deprecated field to avoid 42703
    const target = map[k];
    if (target && out[target] === undefined) {
      if (v !== undefined) out[target] = v;
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
      
      // КРИТИЧНО: Всегда добавляем p_force чтобы PostgREST мог выбрать правильную перегрузку
      // Это решает PGRST203 (ambiguity) для update_game_data_by_wallet_v2
      if (!args.p_force) {
        args.p_force = false;
      }
      
      const keys = Object.keys(args).filter(k => k !== 'p_wallet_address');

      // If we only have wallet, skip RPC to avoid PostgREST overload ambiguity (PGRST203)
      if (keys.length === 0) {
        console.log('ℹ️ [throttler] No fields to update; skipping RPC call');
        return true;
      }
      try {
        console.log('🔁 [throttler] Calling update_game_data_by_wallet_v2 with keys:', Object.keys(args));
        const { data, error } = await supabase.rpc('update_game_data_by_wallet_v2', args as any);
        if (error) throw error;
        const ok = data === true;
        if (!ok) {
          console.warn('⚠️ [throttler] RPC returned false. Args keys:', Object.keys(args));
        }
        return ok;
      } catch (err: any) {
        console.error('❌ [throttler] RPC error:', { code: err?.code, message: err?.message, hint: err?.hint, args: Object.keys(args) });
        // Ambiguity fallback: try sending fields one-by-one to disambiguate overloaded functions
        if (err?.code === 'PGRST203' && keys.length > 0) {
          for (const k of keys) {
            const narrowArgs: Record<string, any> = { p_wallet_address: args.p_wallet_address, [k]: (args as any)[k] };
            try {
              console.log('🧪 [throttler] Retrying with narrow args:', Object.keys(narrowArgs));
              const { data: d2, error: e2 } = await supabase.rpc('update_game_data_by_wallet_v2', narrowArgs as any);
              if (!e2 && d2 === true) {
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
