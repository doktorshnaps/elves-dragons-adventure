import { useEffect, useRef } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { useGameData } from '@/hooks/useGameData';
import { useWalletContext } from '@/contexts/WalletConnectContext';
import { setSyncFreeze, clearSyncFreeze } from '@/utils/updateGameDataThrottle';

/**
 * Синхронизирует локальное состояние Zustand с Supabase
 * 
 * РЕФАКТОРИНГ: 
 * - cards → используйте useCards() и card_instances
 * - dragonEggs → используйте useDragonEggs() из DragonEggContext  
 * - inventory → используйте useItemInstances()
 */
export const useGameSync = () => {
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

  // Очищаем старые данные из localStorage при монтировании
  useEffect(() => {
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
      
      preventSyncAfterClearRef.current = true;
      
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
    
    if (walletLoading || !selector) {
      console.log('⏸️ useGameSync: Waiting for wallet to be ready');
      return;
    }
    
    if (!loading && isConnected && accountId && gameData) {
      isApplyingRef.current = true;
      try {
        console.log('🔄 useGameSync: Loading data from Supabase:', {
          balance: gameData.balance,
          selectedTeam: gameData.selectedTeam?.length,
          accountLevel: gameData.accountLevel,
          accountExperience: gameData.accountExperience
        });
        
        gameStore.setBalance(gameData.balance);
        
        // КРИТИЧНО: Всегда устанавливаем selectedTeam из БД
        const teamFromDB = gameData.selectedTeam || [];
        console.log('🔄 useGameSync: Setting selectedTeam from DB:', {
          length: teamFromDB.length,
          isArray: Array.isArray(teamFromDB),
        });
        gameStore.setSelectedTeam(teamFromDB);
        
        gameStore.setAccountLevel(gameData.accountLevel || 1);
        gameStore.setAccountExperience(gameData.accountExperience || 0);
        
        if (gameData.battleState) {
          gameStore.setBattleState(gameData.battleState);
        }
        
        // Сохраняем синхронизированное состояние
        lastSyncedRef.current = {
          balance: gameData.balance,
          selectedTeam: gameData.selectedTeam || [],
          battleState: gameData.battleState,
          accountLevel: gameData.accountLevel,
          accountExperience: gameData.accountExperience,
        };
        
        preventSyncAfterClearRef.current = false;
        
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
    if (walletLoading || !selector) return;
    if (!isConnected || !accountId || loading) return;
    
    const activeBattle = gameStore.activeBattleInProgress;
    if (activeBattle) {
      console.log('⏸️ [useGameSync] Sync blocked: battle in progress');
      return;
    }
    
    if (preventSyncAfterClearRef.current) {
      console.log('⏸️ Sync blocked: waiting for data to load after clear');
      return;
    }
    
    const unsubscribe = useGameStore.subscribe((state) => {
      if (isApplyingRef.current) return;
      
      // Синхронизируем только UI-состояние (без серверных данных)
      const snapshot = {
        balance: state.balance,
        selectedTeam: state.selectedTeam,
        battleState: state.battleState,
        accountLevel: state.accountLevel,
        accountExperience: state.accountExperience,
      };

      const serverSnapshot = {
        balance: gameData?.balance,
        selectedTeam: gameData?.selectedTeam,
        battleState: gameData?.battleState,
        accountLevel: gameData?.accountLevel,
        accountExperience: gameData?.accountExperience,
      };

      const sameAsServer = JSON.stringify(snapshot) === JSON.stringify(serverSnapshot);
      const sameAsLastSynced = JSON.stringify(snapshot) === JSON.stringify(lastSyncedRef.current);

      if (sameAsServer || sameAsLastSynced) return;
      
      // Защита от затирания команды пустым массивом
      if (snapshot.selectedTeam?.length === 0 && serverSnapshot.selectedTeam && serverSnapshot.selectedTeam.length > 0) {
        console.warn('⚠️ Prevented syncing empty selectedTeam over existing team in DB');
        return;
      }

      const timeoutId = setTimeout(async () => {
        try {
          console.log('🔄 useGameSync: Syncing to Supabase:', {
            selectedTeamLength: snapshot.selectedTeam?.length,
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
