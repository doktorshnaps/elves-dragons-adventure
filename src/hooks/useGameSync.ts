import { useEffect, useRef } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { useGameData } from '@/hooks/useGameData';
import { useWalletContext } from '@/contexts/WalletConnectContext';
import { useCardInstanceSync } from '@/hooks/useCardInstanceSync';

/**
 * Синхронизирует локальное состояние Zustand с Supabase
 */
export const useGameSync = () => {
  const { accountId } = useWalletContext();
  const isConnected = !!accountId;
  const { gameData, updateGameData, loading } = useGameData();
  const gameStore = useGameStore();
  const isApplyingRef = useRef(false);
  const lastSyncedRef = useRef<any>(null);
  const prevAccountIdRef = useRef<string | null>(null);
  
  // Инициализация синхронизации экземпляров карт
  try {
    useCardInstanceSync();
  } catch (error) {
    console.error('❌ Error in useCardInstanceSync:', error);
  }

  // Очищаем старые данные из localStorage при монтировании
  useEffect(() => {
    // Удаляем старый persist store и все старые ключи
    const oldKeys = [
      'game-storage',
      'gameCards',
      'gameBalance',
      'gameInventory',
      'gameDragonEggs',
      'gameSelectedTeam',
      'game_balance',
      'game_cards',
      'game_inventory',
      'game_dragonEggs',
      'game_selectedTeam',
      'game_accountLevel',
      'game_accountExperience'
    ];
    
    oldKeys.forEach(key => {
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
        console.log(`🧹 Cleared old localStorage key: ${key}`);
      }
    });
    
    console.log('✅ localStorage cleanup complete - все данные теперь только в Supabase');
  }, []);

  // Очищаем store при отключении или смене кошелька
  useEffect(() => {
    if (prevAccountIdRef.current && prevAccountIdRef.current !== accountId) {
      console.log('🔄 Wallet changed, clearing all cached data');
      gameStore.clearAllData();
      lastSyncedRef.current = null;
      
      // Очищаем localStorage от данных предыдущего кошелька
      const keysToRemove = [
        'gameData',
        'gameCards',
        'gameBalance',
        'gameInitialized',
        'gameInventory',
        'marketplaceListings',
        'socialQuests',
        'adventurePlayerStats',
        'adventureCurrentMonster',
        'dragonEggs',
        'battleState',
        'selectedTeam'
      ];
      
      keysToRemove.forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch (e) {
          console.error(`Failed to remove ${key} from localStorage:`, e);
        }
      });
      
      // Очищаем memory cache
      try {
        const { gameCache } = require('@/utils/cacheStrategy');
        gameCache.clear();
        console.log('✅ Memory cache cleared');
      } catch (e) {
        console.warn('Failed to clear memory cache:', e);
      }
    }
    prevAccountIdRef.current = accountId;
  }, [accountId]);

  // Загружаем данные из Supabase в локальное состояние при инициализации
  useEffect(() => {
    if (!loading && isConnected && accountId && gameData) {
      isApplyingRef.current = true;
      try {
        console.log('🔄 useGameSync: Loading data from Supabase:', {
          balance: gameData.balance,
          cards: gameData.cards?.length,
          inventory: gameData.inventory?.length,
          dragonEggs: gameData.dragonEggs?.length,
          accountLevel: gameData.accountLevel,
          accountExperience: gameData.accountExperience
        });
        
        gameStore.setBalance(gameData.balance);
        gameStore.setCards(gameData.cards);
        gameStore.setInventory(gameData.inventory || []);
        gameStore.setDragonEggs(gameData.dragonEggs || []);
        gameStore.setSelectedTeam(gameData.selectedTeam || []);
        gameStore.setAccountLevel(gameData.accountLevel || 1);
        gameStore.setAccountExperience(gameData.accountExperience || 0);
        
        if (gameData.battleState) {
          gameStore.setBattleState(gameData.battleState);
        }
        
        console.log('✅ useGameSync: Data loaded to store');
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
    
    const syncToSupabase = async () => {
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

      try {
        await updateGameData(snapshot);
        lastSyncedRef.current = snapshot;
      } catch (e) {
        console.warn('useGameSync: sync failed', e);
      }
    };

    const timeoutId = setTimeout(syncToSupabase, 500);
    return () => clearTimeout(timeoutId);
  }, [isConnected, accountId, loading, gameData, updateGameData]);

  return { loading };
};