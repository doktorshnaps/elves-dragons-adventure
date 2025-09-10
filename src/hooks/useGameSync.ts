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
  
  // Инициализация синхронизации экземпляров карт
  useCardInstanceSync();

  // Загружаем данные из Supabase в локальное состояние при инициализации
  useEffect(() => {
    if (!loading && isConnected && accountId && gameData) {
      gameStore.setBalance(gameData.balance);
      gameStore.setCards(gameData.cards);
      gameStore.setInventory(gameData.inventory || []);
      gameStore.setDragonEggs(gameData.dragonEggs || []);
      gameStore.setSelectedTeam(gameData.selectedTeam || []);
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