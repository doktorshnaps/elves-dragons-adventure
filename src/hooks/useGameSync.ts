import { useEffect } from 'react';
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
  
  // Инициализация синхронизации экземпляров карт - ОТКЛЮЧЕНО
  // useCardInstanceSync();

  // Загружаем данные из Supabase в локальное состояние при инициализации
  useEffect(() => {
    if (!loading && isConnected && accountId && gameData) {
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
    }
  }, [loading, isConnected, accountId, gameData]);

  // Синхронизируем изменения локального состояния с Supabase
  useEffect(() => {
    if (!isConnected || !accountId || loading) return;

    const syncToSupabase = async () => {
      const state = useGameStore.getState();
      await updateGameData({
        balance: state.balance,
        cards: state.cards,
        inventory: state.inventory,
        dragonEggs: state.dragonEggs,
        selectedTeam: state.selectedTeam,
        battleState: state.battleState,
        accountLevel: state.accountLevel,
        accountExperience: state.accountExperience
      });
    };

    // Дебаунсим синхронизацию
    const timeoutId = setTimeout(syncToSupabase, 1000);
    return () => clearTimeout(timeoutId);
  }, [
    gameStore.balance,
    gameStore.cards,
    gameStore.inventory,
    gameStore.dragonEggs,
    gameStore.selectedTeam,
    gameStore.battleState,
    gameStore.accountLevel,
    gameStore.accountExperience
  ]);

  return { loading };
};