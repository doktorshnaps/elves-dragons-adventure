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
        console.log('🔄 Fetching balances for account:', accountId);
        
        const config = {
          networkId: 'mainnet',
          keyStore: new keyStores.BrowserLocalStorageKeyStore(),
          nodeUrl: 'https://rpc.mainnet.near.org',
          walletUrl: 'https://wallet.mainnet.near.org',
          helperUrl: 'https://helper.mainnet.near.org',
        };

        const near = await connect(config);
        
        // Получаем баланс NEAR через provider
        try {
          const account = await near.account(accountId);
          const accountBalance = await account.getAccountBalance();
          const nearBalanceInNear = utils.format.formatNearAmount(accountBalance.available);
          const formattedNear = parseFloat(nearBalanceInNear).toFixed(3);
          console.log('✅ NEAR balance:', formattedNear);
          setNearBalance(formattedNear);
        } catch (err) {
          console.warn('Error fetching NEAR balance:', err);
          setNearBalance('0');
        }

        // Получаем баланс GT токенов через view call
        try {
          const gtContract = 'gt-1733.meme-cooking.near';
          
          const response: any = await near.connection.provider.query({
            request_type: 'call_function',
            account_id: gtContract,
            method_name: 'ft_balance_of',
            args_base64: Buffer.from(JSON.stringify({ account_id: accountId })).toString('base64'),
            finality: 'final',
          });

          const result = JSON.parse(Buffer.from(response.result).toString());
          console.log('Raw GT balance:', result);
          
          // GT токены имеют 18 decimals
          const gtBalanceFormatted = (parseInt(result) / Math.pow(10, 18)).toFixed(2);
          console.log('✅ GT balance:', gtBalanceFormatted);
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
