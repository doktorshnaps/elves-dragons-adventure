import { useState, useEffect } from 'react';
import { JsonRpcProvider, yoctoToNear } from 'near-api-js';
import { useGameEvent } from '@/contexts/GameEventsContext';



interface NearBalances {
  nearBalance: string;
  gtBalance: string;
  loading: boolean;
  error: string | null;
}

// Precise formatter for large integer balances using BigInt
const formatTokenBalance = (
  raw: string,
  decimals: number,
  fractionDigits = 2
): string => {
  try {
    const value = BigInt(raw);
    const base = BigInt(10) ** BigInt(decimals);
    const integer = value / base;
    const fraction = value % base;

    if (fractionDigits <= 0) return integer.toString();

    const scaled = (fraction * BigInt(10 ** Math.min(fractionDigits, 18))) / base;
    const fractionStr = scaled.toString().padStart(Math.min(fractionDigits, 18), '0');

    // Trim trailing zeros
    const trimmedFraction = fractionStr.replace(/0+$/, '');

    return trimmedFraction.length
      ? `${integer.toString()}.${trimmedFraction.slice(0, fractionDigits)}`
      : integer.toString();
  } catch {
    return '0';
  }
};

// Timeout helper for RPC calls. Default reduced from 30s -> 8s and probe 2s
// to avoid blocking the iOS event loop with long pending Error promises.
const withTimeout = async <T>(promise: Promise<T>, ms = 8000): Promise<T> => {
  return (await Promise.race([
    promise,
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error('RPC timeout')), ms)),
  ])) as T;
};

// Multiple NEAR RPC endpoints for fallback
const NEAR_RPC_ENDPOINTS = [
  'https://rpc.mainnet.near.org',
  'https://near-mainnet.api.pagoda.co/rpc/v1/',
  'https://rpc.mainnet.pagoda.co'
];

const DEV = import.meta.env.DEV;

// Try multiple RPC endpoints with fallback. Probe call uses a short 2s
// timeout — synchronous Error stack serialisation on mobile Safari is heavy,
// so we keep messages short and never log the full error object.
const createProviderWithFallback = async () => {
  for (const url of NEAR_RPC_ENDPOINTS) {
    try {
      const provider = new JsonRpcProvider({ url });
      await withTimeout(
        provider.query({ request_type: 'view_account', account_id: 'system', finality: 'final' }),
        2000,
      );
      if (DEV) console.log(`✅ Using NEAR RPC: ${url}`);
      return provider;
    } catch (err: any) {
      if (DEV) console.warn(`❌ NEAR RPC ${url}: ${err?.message || 'failed'}`);
      continue;
    }
  }
  if (DEV) console.warn('⚠️ All RPC endpoints failed, using default');
  return new JsonRpcProvider({ url: NEAR_RPC_ENDPOINTS[0] });
};

export const useNearBalances = (accountId: string | null): NearBalances => {
  const [nearBalance, setNearBalance] = useState<string>('0');
  const [gtBalance, setGtBalance] = useState<string>('0');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshNonce, setRefreshNonce] = useState<number>(0);

  useEffect(() => {
    const targetId = accountId || localStorage.getItem('nearAccountId') || localStorage.getItem('walletAccountId');
    if (!targetId) {
      setNearBalance('0');
      setGtBalance('0');
      return;
    }

    // Load cached balances immediately while fetching fresh data
    try {
      const cached = JSON.parse(localStorage.getItem('walletBalances') || '{}');
      if (cached[targetId]) {
        if (cached[targetId].near) setNearBalance(cached[targetId].near);
        if (cached[targetId].ft?.['gt-1733.meme-cooking.near']) {
          setGtBalance(cached[targetId].ft['gt-1733.meme-cooking.near']);
        }
        if (DEV) console.log('💾 Loaded cached balances');
      }
    } catch (e: any) {
      if (DEV) console.warn('Failed to load cached balances:', e?.message || e);
    }

    let cancelled = false;

    const fetchBalances = async () => {
      if (cancelled) return;
      setLoading(true);
      setError(null);

      try {
        if (DEV) console.log('🔄 Fetching balances for:', targetId);

        const provider = await createProviderWithFallback();
        if (cancelled) return;

        // NEAR balance via RPC view_account
        try {
          let formattedNear = '0.000';
          const view: any = await withTimeout(provider.query({
            request_type: 'view_account',
            account_id: targetId,
            finality: 'final',
          }), 8000);
          if (cancelled) return;
          const totalNear = yoctoToNear(view.amount);
          formattedNear = parseFloat(totalNear).toFixed(3);
          if (DEV) console.log('✅ NEAR balance:', formattedNear);
          setNearBalance(formattedNear);
          try {
            const key = 'walletBalances';
            const current = JSON.parse(localStorage.getItem(key) || '{}');
            localStorage.setItem(key, JSON.stringify({ ...current, [targetId]: { ...(current?.[targetId]||{}), near: formattedNear } }));
          } catch {}
        } catch (err: any) {
          if (DEV) console.warn('NEAR balance fetch failed:', err?.message || 'unknown');
          if (nearBalance === '0') setNearBalance('0');
        }

        if (cancelled) return;

        // GT token balance (gt-1733.meme-cooking.near, decimals: 18)
        try {
          const gtContract = 'gt-1733.meme-cooking.near';
          const args = JSON.stringify({ account_id: targetId });
          const response: any = await withTimeout(provider.query({
            request_type: 'call_function',
            account_id: gtContract,
            method_name: 'ft_balance_of',
            args_base64: btoa(args),
            finality: 'final',
          }), 8000);
          if (cancelled) return;

          const decoder = new TextDecoder();
          const text = decoder.decode(Uint8Array.from(response.result));
          const parsed = JSON.parse(text);

          const raw = typeof parsed === 'string' ? parsed : String(parsed);
          const gt = formatTokenBalance(raw, 18, 2);
          if (DEV) console.log('✅ GT balance:', gt);
          setGtBalance(gt);

          try {
            const key = 'walletBalances';
            const current = JSON.parse(localStorage.getItem(key) || '{}');
            const prev = current?.[targetId] || {};
            localStorage.setItem(key, JSON.stringify({ ...current, [targetId]: { ...prev, ft: { ...(prev.ft||{}), [gtContract]: gt } } }));
          } catch {}
        } catch (err: any) {
          if (DEV) console.warn('GT balance fetch failed:', err?.message || 'unknown');
          if (gtBalance === '0') setGtBalance('0');
        }
      } catch (err: any) {
        if (DEV) console.error('NEAR balances error:', err?.message || 'unknown');
        setError('Ошибка загрузки балансов');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    // Defer the fetch to idle time so it doesn't compete with the initial
    // render and React hydration on iOS WKWebView. Prevents the 3-5s
    // "buttons don't respond" period after page load.
    const ric: any = (typeof window !== 'undefined' && (window as any).requestIdleCallback) || null;
    let idleHandle: any = null;
    let timeoutHandle: any = null;
    if (ric) {
      idleHandle = ric(() => fetchBalances(), { timeout: 2000 });
    } else {
      timeoutHandle = setTimeout(fetchBalances, 800);
    }

    return () => {
      cancelled = true;
      if (idleHandle && (window as any).cancelIdleCallback) {
        (window as any).cancelIdleCallback(idleHandle);
      }
      if (timeoutHandle) clearTimeout(timeoutHandle);
    };
  }, [accountId, refreshNonce]);

  // Refresh balances on wallet events via GameEventsContext
  useGameEvent('walletChanged', (payload) => {
    if (DEV) console.log('🔄 Wallet changed event for NEAR balances');
    setRefreshNonce((n) => n + 1);
  }, []);

  useGameEvent('walletDisconnected', () => {
    setNearBalance('0');
    setGtBalance('0');
  }, []);

  return { nearBalance, gtBalance, loading, error };
};
