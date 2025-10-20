import { useState, useEffect } from 'react';
import * as nearAPI from 'near-api-js';

const { connect, keyStores, utils } = nearAPI;

interface NearBalances {
  nearBalance: string;
  gtBalance: string;
  loading: boolean;
  error: string | null;
}

export const useNearBalances = (accountId: string | null): NearBalances => {
  const [nearBalance, setNearBalance] = useState<string>('0');
  const [gtBalance, setGtBalance] = useState<string>('0');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

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
        const config = {
          networkId: 'mainnet',
          keyStore: new keyStores.BrowserLocalStorageKeyStore(),
          nodeUrl: 'https://rpc.mainnet.near.org',
          walletUrl: 'https://wallet.mainnet.near.org',
          helperUrl: 'https://helper.mainnet.near.org',
        };

        const near = await connect(config);
        const account = await near.account(accountId);

        // Получаем баланс NEAR
        const accountBalance = await account.getAccountBalance();
        const nearBalanceInNear = utils.format.formatNearAmount(accountBalance.available);
        setNearBalance(parseFloat(nearBalanceInNear).toFixed(2));

        // Получаем баланс GT токенов
        try {
          const gtContract = 'gt-1733.meme-cooking.near';
          const result: any = await account.viewFunction({
            contractId: gtContract,
            methodName: 'ft_balance_of',
            args: { account_id: accountId },
          });

          // GT токены имеют 18 decimals
          const gtBalanceFormatted = (parseInt(result) / Math.pow(10, 18)).toFixed(2);
          setGtBalance(gtBalanceFormatted);
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
  }, [accountId]);

  return { nearBalance, gtBalance, loading, error };
};
