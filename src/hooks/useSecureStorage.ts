import { useEffect } from 'react';
import { useWalletContext } from '@/contexts/WalletConnectContext';
import { clearCriticalData } from '@/utils/secureStorage';

/**
 * Hook that clears stale localStorage cache when wallet changes.
 * 
 * All critical game data is fetched from the server (Supabase)
 * on connect — localStorage is only a UI cache.
 */
export const useSecureStorage = () => {
  const { accountId } = useWalletContext();

  // Clear local cache when wallet disconnects to prevent stale data
  useEffect(() => {
    if (!accountId) {
      clearCriticalData();
    }
  }, [accountId]);
};
