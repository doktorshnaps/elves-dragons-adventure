import { useEffect } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { useAuth } from '@/hooks/useAuth';

export const useAccountSync = () => {
  const { user } = useAuth();
  const { syncAccountData } = useGameStore();

  useEffect(() => {
    if (user) {
      syncAccountData();
    }
  }, [user, syncAccountData]);
};