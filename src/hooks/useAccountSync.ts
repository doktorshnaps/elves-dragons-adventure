import { useEffect } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { useWalletContext } from '@/contexts/WalletConnectContext';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook для инициализации данных аккаунта при подключении кошелька
 * Загружает account_level и account_experience из БД
 */
export const useAccountSync = () => {
  const { accountId, selector, isLoading } = useWalletContext();
  const isConnected = !!accountId;
  const { setAccountData } = useGameStore();

  useEffect(() => {
    // Не выполняем синхронизацию пока wallet selector не инициализирован
    if (isLoading || !selector) {
      return;
    }

    const initializeAccountData = async (walletAddress: string) => {
      if (!walletAddress) return;

      const { data, error } = await supabase
        .from('game_data')
        .select('account_level, account_experience')
        .eq('wallet_address', walletAddress)
        .maybeSingle();

      if (!error && data) {
        setAccountData(data.account_level || 1, data.account_experience || 0);
      }
    };

    if (isConnected && accountId) {
      console.log('🔄 Account connected, initializing data for:', accountId);
      initializeAccountData(accountId);
    } else if (!isConnected) {
      console.log('⚠️ Wallet disconnected');
    }
  }, [isConnected, accountId, setAccountData, selector, isLoading]);
};
