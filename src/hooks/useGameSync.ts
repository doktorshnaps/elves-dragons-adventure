import { useEffect } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { useGameData } from '@/hooks/useGameData';
import { useAuth } from '@/hooks/useAuth';

/**
 * Синхронизирует локальное состояние Zustand с Supabase
 */
export const useGameSync = () => {
  const { user } = useAuth();
  const { gameData, updateGameData, loading } = useGameData();
  const gameStore = useGameStore();

  // Загружаем данные из Supabase в локальное состояние при инициализации
  useEffect(() => {
    if (!loading && user && gameData) {
      gameStore.setBalance(gameData.balance);
      gameStore.setCards(gameData.cards);
      gameStore.setInventory(gameData.inventory || []);
      gameStore.setDragonEggs(gameData.dragonEggs || []);
      gameStore.setSelectedTeam(gameData.selectedTeam || []);
      if (gameData.battleState) {
        gameStore.setBattleState(gameData.battleState);
      }
    }
  }, [loading, user, gameData]);

  // Синхронизируем изменения локального состояния с Supabase
  useEffect(() => {
    if (!user || loading) return;

    const syncToSupabase = async () => {
      const state = useGameStore.getState();
      await updateGameData({
        balance: state.balance,
        cards: state.cards,
        inventory: state.inventory,
        dragonEggs: state.dragonEggs,
        selectedTeam: state.selectedTeam,
        battleState: state.battleState
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
    gameStore.battleState
  ]);

  return { loading };
};