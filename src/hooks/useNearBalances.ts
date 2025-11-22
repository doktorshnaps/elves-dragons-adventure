import { useState, useEffect } from 'react';
import * as nearAPI from 'near-api-js';

const { providers, utils } = nearAPI;


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

// Timeout helper for RPC calls
const withTimeout = async <T>(promise: Promise<T>, ms = 30000): Promise<T> => {
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

// Try multiple RPC endpoints with fallback
const createProviderWithFallback = async () => {
  for (const url of NEAR_RPC_ENDPOINTS) {
    try {
      const provider = new providers.JsonRpcProvider({ url });
      // Test the provider with a quick call
      await withTimeout(provider.status(), 5000);
      console.log(`✅ Using NEAR RPC: ${url}`);
      return provider;
    } catch (err) {
      console.warn(`❌ Failed to connect to ${url}:`, err);
      continue;
    }
  }
  // Fallback to first endpoint if all fail
  console.warn('⚠️ All RPC endpoints failed, using default');
  return new providers.JsonRpcProvider({ url: NEAR_RPC_ENDPOINTS[0] });
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
        console.log('💾 Loaded cached balances:', cached[targetId]);
      }
    } catch (e) {
      console.warn('Failed to load cached balances:', e);
    }

    const fetchBalances = async () => {
      setLoading(true);
      setError(null);

      try {
        console.log('🔄 Fetching balances for account:', targetId);

        const provider = await createProviderWithFallback();

        // NEAR balance via RPC view_account
        try {
          let formattedNear = '0.000';
          const view: any = await withTimeout(provider.query({
            request_type: 'view_account',
            account_id: targetId,
            finality: 'final',
          }), 30000);
          const totalNear = utils.format.formatNearAmount(view.amount);
          formattedNear = parseFloat(totalNear).toFixed(3);
          console.log('✅ NEAR balance:', formattedNear, '(raw yoctoNEAR:', view.amount, ')');
          setNearBalance(formattedNear);
          try {
            const key = 'walletBalances';
            const current = JSON.parse(localStorage.getItem(key) || '{}');
            localStorage.setItem(key, JSON.stringify({ ...current, [targetId]: { ...(current?.[targetId]||{}), near: formattedNear } }));
          } catch {}
        } catch (err) {
          console.warn('Error fetching NEAR balance:', err);
          // Don't reset to 0 if we have cached value
          if (nearBalance === '0') setNearBalance('0');
        }

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
          }), 30000);

          // response.result is a Uint8Array/array of bytes → decode to string → JSON.parse
          const decoder = new TextDecoder();
          const text = decoder.decode(Uint8Array.from(response.result));
          const parsed = JSON.parse(text); // returns the raw balance as string

          const raw = typeof parsed === 'string' ? parsed : String(parsed);
          const gt = formatTokenBalance(raw, 18, 2);
          console.log('✅ GT balance:', gt);
          setGtBalance(gt);

          try {
            const key = 'walletBalances';
            const current = JSON.parse(localStorage.getItem(key) || '{}');
            const prev = current?.[targetId] || {};
            localStorage.setItem(key, JSON.stringify({ ...current, [targetId]: { ...prev, ft: { ...(prev.ft||{}), [gtContract]: gt } } }));
          } catch {}
        } catch (err) {
          console.warn('Error fetching GT balance:', err);
          // Don't reset to 0 if we have cached value
          if (gtBalance === '0') setGtBalance('0');
        }
      } catch (err) {
        console.error('Error fetching NEAR balances:', err);
        setError('Ошибка загрузки балансов');
        // Don't reset cached values on error
      } finally {
        setLoading(false);
      }
    };

    fetchBalances();
  }, [accountId, refreshNonce]);

  // Refresh balances on wallet events
  useEffect(() => {
    const onWalletChanged = (e: any) => {
      console.log('🔄 Wallet changed event received for NEAR balances:', e.detail);
      setRefreshNonce((n) => n + 1);
    };
    const onWalletDisconnected = () => {
      setNearBalance('0');
      setGtBalance('0');
    };
    window.addEventListener('wallet-changed', onWalletChanged as any);
    window.addEventListener('wallet-disconnected', onWalletDisconnected as any);
    return () => {
      window.removeEventListener('wallet-changed', onWalletChanged as any);
      window.removeEventListener('wallet-disconnected', onWalletDisconnected as any);
    };
  }, [accountId]);

  return { nearBalance, gtBalance, loading, error };
};
