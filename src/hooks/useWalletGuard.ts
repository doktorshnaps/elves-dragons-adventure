import { useWalletContext } from '@/contexts/WalletConnectContext';

interface WalletGuardResult {
  isReady: boolean;
  accountId: string | null;
  isConnected: boolean;
}

/**
 * Единый guard hook для проверки подключения кошелька
 * Заменяет повторяющиеся проверки `if (!isConnected || !accountId)` по всему коду
 */
export const useWalletGuard = (): WalletGuardResult => {
  const { accountId, isLoading } = useWalletContext();
  const isConnected = !!accountId;
  
  return {
    isReady: !isLoading && isConnected && !!accountId,
    accountId,
    isConnected,
  };
};
