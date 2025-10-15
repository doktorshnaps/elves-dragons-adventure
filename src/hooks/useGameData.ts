import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
// Убираем зависимость от useAuth для работы с кошельками
import { Card } from '@/types/cards';
import { useToast } from '@/hooks/use-toast';
import { initializeCardHealth } from '@/utils/cardHealthUtils';
import { updateGameDataByWalletThrottled } from '@/utils/updateGameDataThrottle';
import { loadGameDataDeduped } from '@/utils/gameDataLoader';
import { localStorageBatcher } from '@/utils/localStorageBatcher';
import { normalizeCardsHealth } from '@/utils/cardHealthNormalizer';

interface GameData {
  balance: number;
  cards: Card[];
  initialized: boolean;
  inventory?: any[];
  marketplaceListings?: any[];
  socialQuests?: any[];
  adventurePlayerStats?: any;
  adventureCurrentMonster?: any;
  dragonEggs?: any[];
  battleState?: any;
  selectedTeam?: any[];
  barracksUpgrades?: any[];
  dragonLairUpgrades?: any[];
  accountLevel?: number;
  accountExperience?: number;
  activeWorkers?: any[];
  // New optional fields to match RPC signature and avoid ambiguity
  buildingLevels?: any;
  activeBuildingUpgrades?: any[];
  wood?: number;
  stone?: number;
  iron?: number;
  gold?: number;
}

export const useGameData = () => {
  // Удаляем зависимость от useAuth для работы с кошельками
  const { toast } = useToast();
  const [gameData, setGameData] = useState<GameData>({
    balance: 0,
    cards: [],
    initialized: false,
    inventory: [],
    marketplaceListings: [],
    socialQuests: [],
    adventurePlayerStats: null,
    adventureCurrentMonster: null,
    dragonEggs: [],
    battleState: null,
    selectedTeam: [],
    barracksUpgrades: [],
    dragonLairUpgrades: [],
    activeWorkers: []
  });
  const [loading, setLoading] = useState(true);
  const [currentWallet, setCurrentWallet] = useState<string | null>(localStorage.getItem('walletAccountId'));
  
  // Echo guard for realtime updates
  const lastUpdateRef = useRef<number>(Date.now());
  
  // Loading deduplication
  const isLoadingRef = useRef<boolean>(false);

  // Загрузка данных из Supabase для кошелька
  const loadGameData = useCallback(async (walletAddress?: string) => {
    const address = walletAddress || localStorage.getItem('walletAccountId');
    
    if (!address) {
      setLoading(false);
      return;
    }

    // Prevent multiple simultaneous loads for the same wallet
    if (isLoadingRef.current) {
      console.log('Load already in progress, waiting...');
      // Wait for current load to complete instead of skipping
      await new Promise(resolve => setTimeout(resolve, 100));
      return;
    }

    isLoadingRef.current = true;
    setLoading(true);

    try {
      console.log('🔄 Loading game data from DB for wallet:', address);
      
      // Use deduplicated loader to prevent multiple simultaneous requests
      const gameDataArray = await loadGameDataDeduped(address);

      if (gameDataArray && gameDataArray.length > 0) {
        const gameRecord = gameDataArray[0];
        console.log('✅ Game data loaded successfully:', gameRecord);
        
        // Process cards - normalize health to fix corrupted values
        const rawCards = (gameRecord.cards as unknown as Card[]) || [];
        const normalizedCards = normalizeCardsHealth(rawCards);
        
        // Check if any cards were fixed and save back to DB
        const hadCorruptedHealth = rawCards.some((card, i) => 
          card.health !== normalizedCards[i].health
        );
        
        if (hadCorruptedHealth) {
          console.log('🔧 Found corrupted health values, fixing in database...');
          // Save normalized cards back to database
          try {
            await updateGameDataByWalletThrottled({
              p_wallet_address: address,
              p_cards: normalizedCards as any
            });
          } catch (e) {
            console.error('Failed to save normalized cards:', e);
          }
        }
        
        const newGameData: GameData = {
          balance: gameRecord.balance || 0,
          cards: normalizedCards,
          initialized: gameRecord.initialized || false,
          inventory: (gameRecord.inventory as any[]) || [],
          marketplaceListings: (gameRecord.marketplace_listings as any[]) || [],
          socialQuests: (gameRecord.social_quests as any[]) || [],
          adventurePlayerStats: gameRecord.adventure_player_stats || null,
          adventureCurrentMonster: gameRecord.adventure_current_monster || null,
          dragonEggs: (gameRecord.dragon_eggs as any[]) || [],
          battleState: gameRecord.battle_state || null,
          selectedTeam: (gameRecord.selected_team as any[]) || [],
          barracksUpgrades: (gameRecord.barracks_upgrades as any[]) || [],
          dragonLairUpgrades: (gameRecord.dragon_lair_upgrades as any[]) || [],
          accountLevel: gameRecord.account_level ?? 1,
          accountExperience: gameRecord.account_experience ?? 0,
          activeWorkers: (gameRecord.active_workers as any[]) || []
        };
        
        setGameData(newGameData);
        
        // Also persist full game record for compatibility
        try {
          localStorage.setItem('gameData', JSON.stringify(gameRecord));
        } catch {}
        
        // Синхронизируем с localStorage через батчер
        localStorageBatcher.setItem('gameCards', newGameData.cards);
        localStorageBatcher.setItem('gameBalance', newGameData.balance.toString());
        localStorageBatcher.setItem('gameInitialized', newGameData.initialized.toString());
        localStorageBatcher.setItem('gameInventory', newGameData.inventory);
        localStorageBatcher.setItem('marketplaceListings', newGameData.marketplaceListings);
        localStorageBatcher.setItem('socialQuests', newGameData.socialQuests);
        if (newGameData.adventurePlayerStats) {
          localStorageBatcher.setItem('adventurePlayerStats', newGameData.adventurePlayerStats);
        }
        if (newGameData.adventureCurrentMonster) {
          localStorageBatcher.setItem('adventureCurrentMonster', newGameData.adventureCurrentMonster);
        }
        localStorageBatcher.setItem('dragonEggs', newGameData.dragonEggs);
        if (newGameData.battleState) {
          localStorageBatcher.setItem('battleState', newGameData.battleState);
        }
        localStorageBatcher.setItem('selectedTeam', newGameData.selectedTeam);
        
        console.log('📦 Game data queued for localStorage sync');
      } else {
        console.log('⚠️ No game data found in database');
      }
    } catch (error) {
      console.error('Error in loadGameData:', error);
    } finally {
      isLoadingRef.current = false;
      setLoading(false);
    }
  }, []);
  // Батчирование обновлений, чтобы не спамить RPC
  const pendingRef = useRef<Partial<GameData>>({});
  const timerRef = useRef<number | null>(null);
  const waitersRef = useRef<Array<() => void>>([]);

  // Обновление данных в Supabase для кошелька (с дебаунсом)
  const updateGameData = useCallback(async (updates: Partial<GameData>) => {
    const walletAddress = localStorage.getItem('walletAccountId');
    if (!walletAddress) return;

    // Store original state for rollback
    const originalGameData = { ...gameData };

    try {
      // Build only meaningful changes and avoid redundant writes
      const deepEqual = (a: any, b: any) => {
        try { return JSON.stringify(a) === JSON.stringify(b); } catch { return false; }
      };

      const changedUpdates: Partial<GameData> = {};

      if (updates.balance !== undefined && updates.balance !== gameData.balance) changedUpdates.balance = updates.balance;
      if (updates.initialized !== undefined && updates.initialized !== gameData.initialized) changedUpdates.initialized = updates.initialized;
      if (updates.accountLevel !== undefined && updates.accountLevel !== gameData.accountLevel) changedUpdates.accountLevel = updates.accountLevel;
      if (updates.accountExperience !== undefined && updates.accountExperience !== gameData.accountExperience) changedUpdates.accountExperience = updates.accountExperience;
      if (updates.inventory !== undefined && !deepEqual(updates.inventory, gameData.inventory)) changedUpdates.inventory = updates.inventory;
      if (updates.marketplaceListings !== undefined && !deepEqual(updates.marketplaceListings, gameData.marketplaceListings)) changedUpdates.marketplaceListings = updates.marketplaceListings;
      if (updates.socialQuests !== undefined && !deepEqual(updates.socialQuests, gameData.socialQuests)) changedUpdates.socialQuests = updates.socialQuests;
      if (updates.adventurePlayerStats !== undefined && !deepEqual(updates.adventurePlayerStats, gameData.adventurePlayerStats)) changedUpdates.adventurePlayerStats = updates.adventurePlayerStats;
      if (updates.adventureCurrentMonster !== undefined && !deepEqual(updates.adventureCurrentMonster, gameData.adventureCurrentMonster)) changedUpdates.adventureCurrentMonster = updates.adventureCurrentMonster;
      if (updates.battleState !== undefined && !deepEqual(updates.battleState, gameData.battleState)) changedUpdates.battleState = updates.battleState;
      if (updates.selectedTeam !== undefined && !deepEqual(updates.selectedTeam, gameData.selectedTeam)) changedUpdates.selectedTeam = updates.selectedTeam;
      if (updates.dragonEggs !== undefined && !deepEqual(updates.dragonEggs, gameData.dragonEggs)) changedUpdates.dragonEggs = updates.dragonEggs;
      if (updates.barracksUpgrades !== undefined && !deepEqual(updates.barracksUpgrades, gameData.barracksUpgrades)) changedUpdates.barracksUpgrades = updates.barracksUpgrades;
      if (updates.dragonLairUpgrades !== undefined && !deepEqual(updates.dragonLairUpgrades, gameData.dragonLairUpgrades)) changedUpdates.dragonLairUpgrades = updates.dragonLairUpgrades;
      if (updates.activeWorkers !== undefined && !deepEqual(updates.activeWorkers, gameData.activeWorkers)) changedUpdates.activeWorkers = updates.activeWorkers;
      if (updates.buildingLevels !== undefined && !deepEqual(updates.buildingLevels, (gameData as any).buildingLevels)) changedUpdates.buildingLevels = updates.buildingLevels;
      if (updates.activeBuildingUpgrades !== undefined && !deepEqual(updates.activeBuildingUpgrades, (gameData as any).activeBuildingUpgrades)) changedUpdates.activeBuildingUpgrades = updates.activeBuildingUpgrades;
      if (updates.wood !== undefined && updates.wood !== (gameData as any).wood) changedUpdates.wood = updates.wood;
      if (updates.stone !== undefined && updates.stone !== (gameData as any).stone) changedUpdates.stone = updates.stone;
      if (updates.iron !== undefined && updates.iron !== (gameData as any).iron) changedUpdates.iron = updates.iron;
      if (updates.gold !== undefined && updates.gold !== (gameData as any).gold) changedUpdates.gold = updates.gold;

      // Cards: normalize health before comparing and saving
      if (updates.cards !== undefined) {
        const a = Array.isArray(updates.cards) ? normalizeCardsHealth(updates.cards) : [];
        const b = Array.isArray(gameData.cards) ? gameData.cards : [];
        const normalize = (arr: any[]) => arr.map((c) => ({ id: c.id, ch: c.currentHealth, lht: c.lastHealTime, mb: c.isInMedicalBay })).sort((x, y) => (x.id > y.id ? 1 : -1));
        if (!deepEqual(normalize(a), normalize(b))) {
          changedUpdates.cards = a as any;
        }
      }

      // If nothing actually changed, skip RPC completely
      if (Object.keys(changedUpdates).length === 0) {
        return;
      }

      // Optimistic UI update only with real changes
      setGameData((prev) => ({ ...prev, ...changedUpdates }));

      // Debug: trace sources
      if (changedUpdates.cards !== undefined) {
        console.warn('🧭 updateGameData(cards): incoming', {
          incoming: Array.isArray(changedUpdates.cards) ? (changedUpdates.cards as any[]).length : 'n/a',
          current: Array.isArray(gameData.cards) ? gameData.cards.length : 0,
          activeBattle: localStorage.getItem('activeBattleInProgress') === 'true'
        });
        console.trace('updateGameData(cards) call stack');
      }
      if (changedUpdates.selectedTeam !== undefined) {
        console.warn('🧭 updateGameData(selectedTeam): incoming', {
          incoming: Array.isArray(changedUpdates.selectedTeam) ? (changedUpdates.selectedTeam as any[]).length : 'n/a',
          current: Array.isArray(gameData.selectedTeam) ? gameData.selectedTeam.length : 0,
          activeBattle: localStorage.getItem('activeBattleInProgress') === 'true'
        });
        console.trace('updateGameData(selectedTeam) call stack');
      }

      console.log('🔄 Updating game data:', changedUpdates);

      // Use throttled RPC to avoid request storms
      const ok = await updateGameDataByWalletThrottled({
        p_wallet_address: walletAddress,
        p_balance: changedUpdates.balance,
        p_cards: (changedUpdates.cards as any),
        p_inventory: (changedUpdates.inventory as any),
        p_selected_team: (changedUpdates.selectedTeam as any),
        p_dragon_eggs: (changedUpdates.dragonEggs as any),
        p_account_level: changedUpdates.accountLevel,
        p_account_experience: changedUpdates.accountExperience,
        p_initialized: changedUpdates.initialized,
        p_marketplace_listings: (changedUpdates.marketplaceListings as any),
        p_social_quests: (changedUpdates.socialQuests as any),
        p_adventure_player_stats: (changedUpdates.adventurePlayerStats as any),
        p_adventure_current_monster: (changedUpdates.adventureCurrentMonster as any),
        p_battle_state: (changedUpdates.battleState as any),
        p_barracks_upgrades: (changedUpdates.barracksUpgrades as any),
        p_dragon_lair_upgrades: (changedUpdates.dragonLairUpgrades as any),
        p_active_workers: (changedUpdates.activeWorkers as any),
        p_building_levels: (changedUpdates.buildingLevels as any),
        p_active_building_upgrades: (changedUpdates.activeBuildingUpgrades as any),
        p_wood: changedUpdates.wood,
        p_stone: changedUpdates.stone,
        p_iron: changedUpdates.iron,
        p_gold: changedUpdates.gold
      });

      if (!ok) {
        console.error('❌ Error updating game data (throttled RPC returned false)');
        // Rollback optimistic update
        setGameData(originalGameData);
        toast({
          title: "Ошибка сохранения",
          description: "Не удалось сохранить данные игры",
          variant: "destructive"
        });
        return;
      }

      // When ok === true, continue with success flow
      console.log('✅ Game data updated successfully');
        
        // Sync changed keys to localStorage через батчер
        if (changedUpdates.cards !== undefined) localStorageBatcher.setItem('gameCards', changedUpdates.cards);
        if (changedUpdates.balance !== undefined) localStorageBatcher.setItem('gameBalance', String(changedUpdates.balance));
        if (changedUpdates.initialized !== undefined) localStorageBatcher.setItem('gameInitialized', String(changedUpdates.initialized));
        if (changedUpdates.inventory !== undefined) localStorageBatcher.setItem('gameInventory', changedUpdates.inventory);
        if (changedUpdates.marketplaceListings !== undefined) localStorageBatcher.setItem('marketplaceListings', changedUpdates.marketplaceListings);
        if (changedUpdates.socialQuests !== undefined) localStorageBatcher.setItem('socialQuests', changedUpdates.socialQuests);
        if (changedUpdates.adventurePlayerStats !== undefined && changedUpdates.adventurePlayerStats) {
          localStorageBatcher.setItem('adventurePlayerStats', changedUpdates.adventurePlayerStats);
        }
        if (changedUpdates.adventureCurrentMonster !== undefined && changedUpdates.adventureCurrentMonster) {
          localStorageBatcher.setItem('adventureCurrentMonster', changedUpdates.adventureCurrentMonster);
        }
        if (changedUpdates.dragonEggs !== undefined) localStorageBatcher.setItem('dragonEggs', changedUpdates.dragonEggs);
        if (changedUpdates.battleState !== undefined && changedUpdates.battleState) {
          localStorageBatcher.setItem('battleState', changedUpdates.battleState);
        }
        if (changedUpdates.selectedTeam !== undefined) localStorageBatcher.setItem('selectedTeam', changedUpdates.selectedTeam);

        // Maintain a full 'gameData' snapshot for components expecting snake_case
        try {
          const raw = localStorage.getItem('gameData');
          const gd = raw ? JSON.parse(raw) : {};
          if (changedUpdates.cards !== undefined) gd.cards = changedUpdates.cards;
          if (changedUpdates.balance !== undefined) gd.balance = changedUpdates.balance;
          if (changedUpdates.initialized !== undefined) gd.initialized = changedUpdates.initialized;
          if (changedUpdates.inventory !== undefined) gd.inventory = changedUpdates.inventory;
          if (changedUpdates.marketplaceListings !== undefined) gd.marketplace_listings = changedUpdates.marketplaceListings;
          if (changedUpdates.socialQuests !== undefined) gd.social_quests = changedUpdates.socialQuests;
          if (changedUpdates.adventurePlayerStats !== undefined) gd.adventure_player_stats = changedUpdates.adventurePlayerStats;
          if (changedUpdates.adventureCurrentMonster !== undefined) gd.adventure_current_monster = changedUpdates.adventureCurrentMonster;
          if (changedUpdates.dragonEggs !== undefined) gd.dragon_eggs = changedUpdates.dragonEggs;
          if (changedUpdates.battleState !== undefined) gd.battle_state = changedUpdates.battleState;
          if (changedUpdates.selectedTeam !== undefined) gd.selected_team = changedUpdates.selectedTeam;
          if (changedUpdates.barracksUpgrades !== undefined) gd.barracks_upgrades = changedUpdates.barracksUpgrades;
          if (changedUpdates.dragonLairUpgrades !== undefined) gd.dragon_lair_upgrades = changedUpdates.dragonLairUpgrades;
          if (changedUpdates.accountLevel !== undefined) gd.account_level = changedUpdates.accountLevel;
          if (changedUpdates.accountExperience !== undefined) gd.account_experience = changedUpdates.accountExperience;
          localStorage.setItem('gameData', JSON.stringify(gd));
        } catch {}
        // Отправляем события для обновления UI
        if (changedUpdates.balance !== undefined) {
          const balanceEvent = new CustomEvent('balanceUpdate', { 
            detail: { balance: changedUpdates.balance }
          });
          window.dispatchEvent(balanceEvent);
        }

        if (changedUpdates.cards !== undefined) {
          const cardsEvent = new CustomEvent('cardsUpdate', { 
            detail: { cards: changedUpdates.cards }
          });
          window.dispatchEvent(cardsEvent);
        }

    } catch (error) {
      console.error('Error in updateGameData:', error);
      // Rollback optimistic update on unexpected errors
      setGameData(originalGameData);
    }
  }, [toast, gameData]);

  // Загружаем данные при инициализации
  useEffect(() => {
    loadGameData();
  }, [loadGameData]);

  // Слушаем смену кошелька и мгновенно подтягиваем данные
  useEffect(() => {
    const onWalletChanged = (e: Event) => {
      const detail = (e as CustomEvent).detail as { walletAddress?: string };
      const newWallet = detail?.walletAddress || localStorage.getItem('walletAccountId');
      setCurrentWallet(newWallet || null);
      if (newWallet) {
        loadGameData(newWallet);
      }
    };

    const onWalletDisconnected = () => {
      setCurrentWallet(null);
      // Полный сброс состояния игры
      setGameData({
        balance: 0,
        cards: [],
        initialized: false,
        inventory: [],
        marketplaceListings: [],
        socialQuests: [],
        adventurePlayerStats: null,
        adventureCurrentMonster: null,
        dragonEggs: [],
        battleState: null,
        selectedTeam: [],
        barracksUpgrades: [],
        dragonLairUpgrades: [],
        activeWorkers: []
      });
    };

    window.addEventListener('wallet-changed', onWalletChanged as EventListener);
    window.addEventListener('wallet-disconnected', onWalletDisconnected as EventListener);

    return () => {
      window.removeEventListener('wallet-changed', onWalletChanged as EventListener);
      window.removeEventListener('wallet-disconnected', onWalletDisconnected as EventListener);
    };
  }, [loadGameData]);

  // Подписка на изменения в реальном времени для кошелька
  useEffect(() => {
    if (!currentWallet) return;
    
    const channel = supabase
      .channel('game-data-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'game_data',
          filter: `wallet_address=eq.${currentWallet}`
        },
        (payload) => {
          const now = Date.now();
          // Echo guard: ignore changes that happened too soon (likely our own update)
          if (now - lastUpdateRef.current < 2000) {
            console.log('Real-time update ignored (echo guard)', payload.eventType);
            return;
          }
          
          console.log('Real-time update accepted:', payload.eventType);
          lastUpdateRef.current = now;
          loadGameData(currentWallet);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentWallet, loadGameData]);

  return {
    gameData,
    loading,
    updateGameData,
    loadGameData
  };
};