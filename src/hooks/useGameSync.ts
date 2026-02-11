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
  const { accountId, selector, isLoading: walletLoading } = useWalletContext();
  const isConnected = !!accountId;
  const { gameData, updateGameData, loading } = useGameData();
  const gameStore = useGameStore();
  const isApplyingRef = useRef(false);
  const lastSyncedRef = useRef<any>(null);
  const prevAccountIdRef = useRef<string | null>(null);
  const preventSyncAfterClearRef = useRef(false);

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
      }
    });
  }, []);

  // Очищаем store при отключении или смене кошелька
  useEffect(() => {
    if (prevAccountIdRef.current && prevAccountIdRef.current !== accountId) {
      if (import.meta.env.DEV) console.log('🔄 Wallet changed, clearing all cached data');
      
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
      } catch (e) {
      }
    }
    prevAccountIdRef.current = accountId;
  }, [accountId]);

  // Загружаем данные из Supabase в локальное состояние при инициализации
  useEffect(() => {
    if (walletLoading || !selector) return;
    
    if (!loading && isConnected && accountId && gameData) {
      isApplyingRef.current = true;
      try {
        
        gameStore.setBalance(gameData.balance);
        
        // ❌ УДАЛЕНО: selectedTeam теперь управляется через player_teams, не game_data
        // Команда для подземелья загружается через usePlayerTeams hook
        // gameStore.setSelectedTeam(teamFromDB); - убрано, чтобы не перезаписывать player_teams
        
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
      
      return;
    }
    
    if (preventSyncAfterClearRef.current) {
      
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
