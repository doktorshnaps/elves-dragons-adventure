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
  // CRITICAL: This should always log if hook is called
  console.log('🚀🚀🚀 useGameSync HOOK CALLED 🚀🚀🚀');
  
  const { accountId, selector, isLoading: walletLoading } = useWalletContext();
  const isConnected = !!accountId;
  const { gameData, updateGameData, loading } = useGameData();
  const gameStore = useGameStore();
  const isApplyingRef = useRef(false);
  const lastSyncedRef = useRef<any>(null);
  const prevAccountIdRef = useRef<string | null>(null);
  const preventSyncAfterClearRef = useRef(false);
  
  console.log('🚀 useGameSync: State values:', {
    accountId,
    isConnected,
    loading,
    hasGameData: !!gameData,
    walletLoading,
    hasSelector: !!selector
  });
  
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
    console.log('🔍 useGameSync: Effect triggered with:', {
      loading,
      isConnected,
      accountId,
      hasGameData: !!gameData,
      gameDataValue: gameData,
      walletLoading,
      hasSelector: !!selector
    });
    
    // Не загружаем данные пока wallet не готов
    if (walletLoading || !selector) {
      console.log('⏸️ useGameSync: Waiting for wallet to be ready');
      return;
    }
    
    if (!loading && isConnected && accountId && gameData) {
      isApplyingRef.current = true;
      try {
        console.log('🔄 useGameSync: Loading data from Supabase:', {
          balance: gameData.balance,
          cards: gameData.cards?.length,
          dragonEggs: gameData.dragonEggs?.length,
          selectedTeam: gameData.selectedTeam?.length,
          selectedTeamRaw: gameData.selectedTeam,
          selectedTeamType: typeof gameData.selectedTeam,
          selectedTeamIsArray: Array.isArray(gameData.selectedTeam),
          accountLevel: gameData.accountLevel,
          accountExperience: gameData.accountExperience
        });
        
        gameStore.setBalance(gameData.balance);
        gameStore.setCards(gameData.cards);
        gameStore.setDragonEggs(gameData.dragonEggs || []);
        
        // КРИТИЧНО: Всегда устанавливаем selectedTeam из БД
        const teamFromDB = gameData.selectedTeam || [];
        console.log('🔄 useGameSync: Setting selectedTeam from DB:', {
          length: teamFromDB.length,
          data: JSON.stringify(teamFromDB).substring(0, 200),
          isArray: Array.isArray(teamFromDB),
          firstItem: teamFromDB[0] ? JSON.stringify(teamFromDB[0]).substring(0, 100) : 'no items'
        });
        gameStore.setSelectedTeam(teamFromDB);
        console.log('✅ useGameSync: Team set in store, new selectedTeam:', gameStore.selectedTeam?.length);
        
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
          selectedTeam: gameData.selectedTeam || [],
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

  // Синхронизируем изменения локального состояния с Supabase через подписку на store
  useEffect(() => {
    // Не синхронизируем пока wallet не готов
    if (walletLoading || !selector) return;
    if (!isConnected || !accountId || loading) return;
    
    // КРИТИЧНО: блокируем синхронизацию сразу после clearAllData()
    if (preventSyncAfterClearRef.current) {
      console.log('⏸️ Sync blocked: waiting for data to load after clear');
      return;
    }
    
    // Подписываемся на изменения store через Zustand subscribe
    const unsubscribe = useGameStore.subscribe((state) => {
      // Пропускаем если применяем данные из БД
      if (isApplyingRef.current) return;
      
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
      
      // КРИТИЧНО: Защита от затирания команды пустым массивом
      if (snapshot.selectedTeam?.length === 0 && serverSnapshot.selectedTeam && serverSnapshot.selectedTeam.length > 0) {
        console.warn('⚠️ Prevented syncing empty selectedTeam over existing team in DB');
        return;
      }

      // Дебаунс синхронизации
      const timeoutId = setTimeout(async () => {
        try {
          console.log('🔄 useGameSync: Syncing to Supabase:', {
            selectedTeamLength: snapshot.selectedTeam?.length,
            cardsLength: snapshot.cards?.length
          });
          await updateGameData(snapshot);
          lastSyncedRef.current = snapshot;
        } catch (e) {
          console.warn('useGameSync: sync failed', e);
        }
      }, 500);

      return () => clearTimeout(timeoutId);
    });

    return unsubscribe;
  }, [isConnected, accountId, loading, gameData, updateGameData, walletLoading, selector]);

  return { loading };
};