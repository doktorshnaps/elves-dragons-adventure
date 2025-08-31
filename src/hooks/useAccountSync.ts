import { useEffect } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { useWallet } from '@/hooks/useWallet';

export const useAccountSync = () => {
  const { isConnected, accountId } = useWallet();
  const { syncAccountData, initializeAccountData } = useGameStore();

  useEffect(() => {
    if (isConnected && accountId) {
      initializeAccountData(accountId).then(() => {
        syncAccountData(accountId);
      });
    }
  }, [isConnected, accountId, syncAccountData, initializeAccountData]);
};