import { useEffect, useRef } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { useGameData } from '@/hooks/useGameData';
import { useWallet } from '@/hooks/useWallet';
import { useCardInstanceSync } from '@/hooks/useCardInstanceSync';

/**
 * Синхронизирует локальное состояние Zustand с Supabase
 */
export const useGameSync = () => {
  const { accountId, isConnected } = useWallet();
  const { gameData, updateGameData, loading } = useGameData();
  const gameStore = useGameStore();
  const isApplyingRef = useRef(false);
  const lastSyncedRef = useRef<any>(null);
  
  // Инициализация синхронизации экземпляров карт
  try {
    useCardInstanceSync();
  } catch (error) {
    console.error('❌ Error in useCardInstanceSync:', error);
  }

  // Загружаем данные из Supabase в локальное состояние при инициализации
  useEffect(() => {
    if (!loading && isConnected && accountId && gameData) {
      isApplyingRef.current = true;
      try {
        gameStore.setBalance(gameData.balance);
        gameStore.setCards(gameData.cards);
        gameStore.setInventory(gameData.inventory || []);
        gameStore.setDragonEggs(gameData.dragonEggs || []);
        gameStore.setSelectedTeam(gameData.selectedTeam || []);
        
        // Синхронизируем уровень и опыт аккаунта только если в gameData есть актуальные данные из БД
        // и они не являются дефолтными значениями
        if (gameData.accountLevel > 1 || gameData.accountExperience > 0) {
          gameStore.setAccountLevel(gameData.accountLevel);
          gameStore.setAccountExperience(gameData.accountExperience);
          console.log('🔄 useGameSync: Account data synced from gameData:', {
            level: gameData.accountLevel,
            experience: gameData.accountExperience
          });
        } else {
          console.log('⚠️ useGameSync: Skipping account sync - using default values from gameData, relying on useAccountSync');
        }
        
        if (gameData.battleState) {
          gameStore.setBattleState(gameData.battleState);
        }
      } finally {
        setTimeout(() => { isApplyingRef.current = false; }, 0);
      }
    }
  }, [loading, isConnected, accountId, gameData]);

  // Синхронизируем изменения локального состояния с Supabase (без зацикливания)
  useEffect(() => {
    if (!isConnected || !accountId || loading) return;
    if (isApplyingRef.current) return;

    const state = useGameStore.getState();
    const snapshot = {
      balance: state.balance,
      cards: state.cards,
      inventory: state.inventory,
      dragonEggs: state.dragonEggs,
      selectedTeam: state.selectedTeam,
      battleState: state.battleState,
      accountLevel: state.accountLevel,
      accountExperience: state.accountExperience,
    };

    const serverSnapshot = {
      balance: gameData?.balance,
      cards: gameData?.cards,
      inventory: gameData?.inventory,
      dragonEggs: gameData?.dragonEggs,
      selectedTeam: gameData?.selectedTeam,
      battleState: gameData?.battleState,
      accountLevel: gameData?.accountLevel,
      accountExperience: gameData?.accountExperience,
    };

    const sameAsServer = JSON.stringify(snapshot) === JSON.stringify(serverSnapshot);
    const sameAsLastSynced = JSON.stringify(snapshot) === JSON.stringify(lastSyncedRef.current);

    if (sameAsServer || sameAsLastSynced) return;

    const syncToSupabase = async () => {
      try {
        await updateGameData(snapshot);
        lastSyncedRef.current = snapshot;
      } catch (e) {
        console.warn('useGameSync: sync failed', e);
      }
    };

    const timeoutId = setTimeout(syncToSupabase, 800);
    return () => clearTimeout(timeoutId);
  }, [
    isConnected,
    accountId,
    loading,
    gameStore.balance,
    gameStore.cards,
    gameStore.inventory,
    gameStore.dragonEggs,
    gameStore.selectedTeam,
    gameStore.battleState,
    gameStore.accountLevel,
    gameStore.accountExperience,
    gameData
  ]);

  return { loading };
};