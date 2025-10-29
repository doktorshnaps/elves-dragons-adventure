import { useEffect } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { useWalletContext } from '@/contexts/WalletConnectContext';

export const useAccountSync = () => {
  const { accountId, selector, isLoading } = useWalletContext();
  const isConnected = !!accountId;
  const { syncAccountData, initializeAccountData, clearAllData } = useGameStore();

  useEffect(() => {
    // Не выполняем синхронизацию пока wallet selector не инициализирован
    if (isLoading || !selector) {
      return;
    }

    if (isConnected && accountId) {
      console.log('🔄 Account connected, syncing data for:', accountId);
      initializeAccountData(accountId).then(() => {
        // Всегда синхронизируем с БД при подключении
        syncAccountData(accountId);
      });
    } else if (!isConnected) {
      console.log('⚠️ Wallet disconnected');
      // При отключении кошелька сбрасываем только уровень и опыт до дефолтных значений
      // остальные данные остаются для избежания потери прогресса при HMR
    }
  }, [isConnected, accountId, syncAccountData, initializeAccountData, selector, isLoading]);
};