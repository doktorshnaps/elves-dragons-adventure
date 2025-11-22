import { useEffect, useRef } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { useGameData } from '@/hooks/useGameData';
import { useWalletContext } from '@/contexts/WalletConnectContext';
import { useCardInstanceSync } from '@/hooks/useCardInstanceSync';
import { setSyncFreeze, clearSyncFreeze } from '@/utils/updateGameDataThrottle';

/**
 * Синхронизирует локальное состояние Zustand с Supabase
 */
export const useGameSync = () => {
  const { accountId, selector, isLoading: walletLoading } = useWalletContext();
  const isConnected = !!accountId;
  const { gameData, updateGameData, loading } = useGameData();
  const gameStore = useGameStore();
  const isApplyingRef = useRef(false);
  const lastSyncedRef = useRef<any>(null);
  const prevAccountIdRef = useRef<string | null>(null);
  const preventSyncAfterClearRef = useRef(false);
  
  // Всегда вызываем хук, но внутри него будет проверка готовности
  useCardInstanceSync();

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
      
      // КРИТИЧНО: блокируем синхронизацию перед очисткой (двойная защита)
      preventSyncAfterClearRef.current = true;
      
      // Глобальный freeze на 3 секунды для throttler
      if (accountId) {
        setSyncFreeze(accountId, 3000);
      }
      
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
    // Не загружаем данные пока wallet не готов
    if (walletLoading || !selector) return;
    
    if (!loading && isConnected && accountId && gameData) {
      isApplyingRef.current = true;
      try {
        console.log('🔄 useGameSync: Loading data from Supabase:', {
          balance: gameData.balance,
          cards: gameData.cards?.length,
          dragonEggs: gameData.dragonEggs?.length,
          selectedTeam: gameData.selectedTeam?.length,
          accountLevel: gameData.accountLevel,
          accountExperience: gameData.accountExperience
        });
        
        gameStore.setBalance(gameData.balance);
        gameStore.setCards(gameData.cards);
        gameStore.setDragonEggs(gameData.dragonEggs || []);
        
        // КРИТИЧНО: Не перезаписываем selectedTeam пустым массивом, если локально есть команда
        const currentTeam = gameStore.selectedTeam;
        const newTeam = gameData.selectedTeam || [];
        
        if (newTeam.length === 0 && currentTeam.length > 0) {
          console.log('⚠️ useGameSync: Preventing selectedTeam overwrite - keeping local team:', currentTeam.length);
          // Синхронизируем локальную команду обратно в БД
          setTimeout(() => {
            updateGameData({ selectedTeam: currentTeam }).catch(err => 
              console.error('Failed to sync local team to DB:', err)
            );
          }, 500);
        } else {
          console.log('✅ useGameSync: Setting selectedTeam from DB:', newTeam.length);
          gameStore.setSelectedTeam(newTeam);
        }
        
        gameStore.setAccountLevel(gameData.accountLevel || 1);
        gameStore.setAccountExperience(gameData.accountExperience || 0);
        
        if (gameData.battleState) {
          gameStore.setBattleState(gameData.battleState);
        }
        
        // Сохраняем синхронизированное состояние
        lastSyncedRef.current = {
          balance: gameData.balance,
          cards: gameData.cards,
          dragonEggs: gameData.dragonEggs,
          selectedTeam: gameData.selectedTeam,
          battleState: gameData.battleState,
          accountLevel: gameData.accountLevel,
          accountExperience: gameData.accountExperience,
        };
        
        // Разрешаем синхронизацию после успешной загрузки данных
        preventSyncAfterClearRef.current = false;
        
        // Снимаем глобальный freeze
        if (accountId) {
          clearSyncFreeze(accountId);
        }
        
        console.log('✅ useGameSync: Data loaded to store');
      } finally {
        setTimeout(() => { isApplyingRef.current = false; }, 0);
      }
    }
  }, [loading, isConnected, accountId, gameData, walletLoading, selector]);

  // Синхронизируем изменения локального состояния с Supabase (без зацикливания)
  useEffect(() => {
    // Не синхронизируем пока wallet не готов
    if (walletLoading || !selector) return;
    if (!isConnected || !accountId || loading) return;
    if (isApplyingRef.current) return;
    
    // КРИТИЧНО: блокируем синхронизацию сразу после clearAllData(), чтобы не затереть данные в БД
    if (preventSyncAfterClearRef.current) {
      console.log('⏸️ Sync blocked: waiting for data to load after clear');
      return;
    }

    const state = useGameStore.getState();
    
    const syncToSupabase = async () => {
      const snapshot = {
        balance: state.balance,
        cards: state.cards,
        dragonEggs: state.dragonEggs,
        selectedTeam: state.selectedTeam,
        battleState: state.battleState,
        accountLevel: state.accountLevel,
        accountExperience: state.accountExperience,
      };

      const serverSnapshot = {
        balance: gameData?.balance,
        cards: gameData?.cards,
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
  }, [isConnected, accountId, loading, gameData, updateGameData, walletLoading, selector]);

  return { loading };
};