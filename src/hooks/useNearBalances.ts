import { useState, useEffect } from 'react';
import * as nearAPI from 'near-api-js';

const { connect, keyStores, utils } = nearAPI;


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

export const useNearBalances = (accountId: string | null): NearBalances => {
  const [nearBalance, setNearBalance] = useState<string>('0');
  const [gtBalance, setGtBalance] = useState<string>('0');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshNonce, setRefreshNonce] = useState<number>(0);

  useEffect(() => {
    if (!accountId) {
      setNearBalance('0');
      setGtBalance('0');
      return;
    }

    const fetchBalances = async () => {
      setLoading(true);
      setError(null);

      try {
        console.log('🔄 Fetching balances for account:', accountId);

        const config = {
          networkId: 'mainnet',
          keyStore: new keyStores.BrowserLocalStorageKeyStore(),
          nodeUrl: 'https://rpc.mainnet.near.org',
          walletUrl: 'https://wallet.mainnet.near.org',
          helperUrl: 'https://helper.mainnet.near.org',
        } as const;

        const near = await connect(config);

        // NEAR balance via RPC view_account with fallback to account.getAccountBalance
        try {
          let formattedNear = '0.000';
          try {
            const view: any = await near.connection.provider.query({
              request_type: 'view_account',
              account_id: accountId,
              finality: 'final',
            });
            const totalNear = utils.format.formatNearAmount(view.amount);
            formattedNear = parseFloat(totalNear).toFixed(3);
          } catch (e) {
            const account = await near.account(accountId);
            const accountBalance = await account.getAccountBalance();
            const nearBalanceInNear = utils.format.formatNearAmount(accountBalance.available);
            formattedNear = parseFloat(nearBalanceInNear).toFixed(3);
          }
          console.log('✅ NEAR balance:', formattedNear);
          setNearBalance(formattedNear);
          try {
            const key = 'walletBalances';
            const current = JSON.parse(localStorage.getItem(key) || '{}');
            localStorage.setItem(key, JSON.stringify({ ...current, [accountId]: { ...(current?.[accountId]||{}), near: formattedNear } }));
          } catch {}
        } catch (err) {
          console.warn('Error fetching NEAR balance:', err);
          setNearBalance('0');
        }

        // GT token balance (gt-1733.meme-cooking.near, decimals: 18)
        try {
          const gtContract = 'gt-1733.meme-cooking.near';

          const args = JSON.stringify({ account_id: accountId });
          const response: any = await near.connection.provider.query({
            request_type: 'call_function',
            account_id: gtContract,
            method_name: 'ft_balance_of',
            args_base64: btoa(args),
            finality: 'final',
          });

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
            const prev = current?.[accountId] || {};
            localStorage.setItem(key, JSON.stringify({ ...current, [accountId]: { ...prev, ft: { ...(prev.ft||{}), [gtContract]: gt } } }));
          } catch {}
        } catch (err) {
          console.warn('Error fetching GT balance:', err);
          setGtBalance('0');
        }
      } catch (err) {
        console.error('Error fetching NEAR balances:', err);
        setError('Ошибка загрузки балансов');
        setNearBalance('0');
        setGtBalance('0');
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
