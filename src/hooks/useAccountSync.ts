import { useEffect } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { useWalletContext } from '@/contexts/WalletConnectContext';

export const useAccountSync = () => {
  const { accountId, selector, isLoading } = useWalletContext();
  const isConnected = !!accountId;
  const { initializeAccountData } = useGameStore();

  useEffect(() => {
    // Не выполняем синхронизацию пока wallet selector не инициализирован
    if (isLoading || !selector) {
      return;
    }

    if (isConnected && accountId) {
      console.log('🔄 Account connected, initializing data for:', accountId);
      initializeAccountData(accountId);
    } else if (!isConnected) {
      console.log('⚠️ Wallet disconnected');
    }
  }, [isConnected, accountId, initializeAccountData, selector, isLoading]);
};