import { useEffect } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { useWallet } from '@/hooks/useWallet';

export const useAccountSync = () => {
  const { isConnected, accountId } = useWallet();
  const { syncAccountData, initializeAccountData, clearAllData } = useGameStore();

  useEffect(() => {
    if (isConnected && accountId) {
      console.log('🔄 Account connected, syncing data for:', accountId);
      initializeAccountData(accountId).then(() => {
        syncAccountData(accountId);
      });
    } else if (!isConnected) {
      // Не сбрасываем данные мгновенно при кратковременном дисконнекте (например, при HMR)
      // Оставляем локальные данные нетронутыми, чтобы избежать "сброса" уровня
      console.log('⚠️ Disconnected temporarily — preserving local game data');
    }
  }, [isConnected, accountId, syncAccountData, initializeAccountData, clearAllData]);
};