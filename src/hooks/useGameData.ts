import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
// Убираем зависимость от useAuth для работы с кошельками
import { Card } from '@/types/cards';
import { useToast } from '@/hooks/use-toast';
import { initializeCardHealth } from '@/utils/cardHealthUtils';

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

  // Загрузка данных из Supabase для кошелька
  const loadGameData = useCallback(async (walletAddress?: string) => {
    const address = walletAddress || localStorage.getItem('walletAccountId');
    
    if (!address) {
      setLoading(false);
      return;
    }

    try {
      console.log('🔄 Loading game data for wallet:', address);
      
      // Use the secure function to get game data
      const { data: gameDataArray, error } = await supabase.rpc('get_game_data_by_wallet', {
        p_wallet_address: address
      });

      if (error) {
        console.error('❌ Error loading game data:', error);
        setLoading(false);
        return;
      }

      if (gameDataArray && gameDataArray.length > 0) {
        const gameRecord = gameDataArray[0];
        console.log('✅ Game data loaded successfully:', gameRecord);
        
        // Process cards without altering timestamps/health
        const rawCards = (gameRecord.cards as unknown as Card[]) || [];
        const initializedCards = rawCards.map(card => ({
          ...card
        }));
        // Do not modify lastHealTime or currentHealth here
        
        const newGameData: GameData = {
          balance: gameRecord.balance || 0,
          cards: initializedCards,
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
        
        // Синхронизируем с localStorage для обратной совместимости
        localStorage.setItem('gameCards', JSON.stringify(newGameData.cards));
        localStorage.setItem('gameBalance', newGameData.balance.toString());
        localStorage.setItem('gameInitialized', newGameData.initialized.toString());
        localStorage.setItem('gameInventory', JSON.stringify(newGameData.inventory));
        localStorage.setItem('marketplaceListings', JSON.stringify(newGameData.marketplaceListings));
        localStorage.setItem('socialQuests', JSON.stringify(newGameData.socialQuests));
        if (newGameData.adventurePlayerStats) {
          localStorage.setItem('adventurePlayerStats', JSON.stringify(newGameData.adventurePlayerStats));
        }
        if (newGameData.adventureCurrentMonster) {
          localStorage.setItem('adventureCurrentMonster', JSON.stringify(newGameData.adventureCurrentMonster));
        }
        localStorage.setItem('dragonEggs', JSON.stringify(newGameData.dragonEggs));
        if (newGameData.battleState) {
          localStorage.setItem('battleState', JSON.stringify(newGameData.battleState));
        }
        localStorage.setItem('selectedTeam', JSON.stringify(newGameData.selectedTeam));
        
        console.log('📦 Game data synced to localStorage');
      } else {
        console.log('⚠️ No game data found in database');
      }
    } catch (error) {
      console.error('Error in loadGameData:', error);
    } finally {
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

      // Cards: compare by id/currentHealth/lastHealTime/isInMedicalBay to avoid noise
      if (updates.cards !== undefined) {
        const a = Array.isArray(updates.cards) ? updates.cards : [];
        const b = Array.isArray(gameData.cards) ? gameData.cards : [];
        const normalize = (arr: any[]) => arr.map((c) => ({ id: c.id, ch: c.currentHealth, lht: c.lastHealTime, mb: c.isInMedicalBay })).sort((x, y) => (x.id > y.id ? 1 : -1));
        if (!deepEqual(normalize(a), normalize(b))) {
          changedUpdates.cards = updates.cards as any;
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

      // Use the secure function to update game data
      const { data: success, error } = await supabase.rpc('update_game_data_by_wallet', {
        p_wallet_address: walletAddress,
        p_balance: changedUpdates.balance ?? null,
        p_cards: (changedUpdates.cards as any) ?? null,
        p_inventory: (changedUpdates.inventory as any) ?? null,
        p_selected_team: (changedUpdates.selectedTeam as any) ?? null,
        p_dragon_eggs: (changedUpdates.dragonEggs as any) ?? null,
        p_account_level: changedUpdates.accountLevel ?? null,
        p_account_experience: changedUpdates.accountExperience ?? null,
        p_initialized: changedUpdates.initialized ?? null,
        p_marketplace_listings: (changedUpdates.marketplaceListings as any) ?? null,
        p_social_quests: (changedUpdates.socialQuests as any) ?? null,
        p_adventure_player_stats: (changedUpdates.adventurePlayerStats as any) ?? null,
        p_adventure_current_monster: (changedUpdates.adventureCurrentMonster as any) ?? null,
        p_battle_state: (changedUpdates.battleState as any) ?? null,
        p_barracks_upgrades: (changedUpdates.barracksUpgrades as any) ?? null,
        p_dragon_lair_upgrades: (changedUpdates.dragonLairUpgrades as any) ?? null,
        p_active_workers: (changedUpdates.activeWorkers as any) ?? null,
        // Extra fields to disambiguate overloaded RPC
        p_building_levels: (changedUpdates.buildingLevels as any) ?? null,
        p_active_building_upgrades: (changedUpdates.activeBuildingUpgrades as any) ?? null,
        p_wood: (changedUpdates.wood as any) ?? null,
        p_stone: (changedUpdates.stone as any) ?? null,
        p_iron: (changedUpdates.iron as any) ?? null,
        p_gold: (changedUpdates.gold as any) ?? null
      });

      if (error) {
        console.error('❌ Error updating game data:', error);
        // Rollback optimistic update
        setGameData(originalGameData);
        toast({
          title: "Ошибка сохранения",
          description: "Не удалось сохранить данные игры",
          variant: "destructive"
        });
        return;
      }

      if (success) {
        console.log('✅ Game data updated successfully');
        
        // Sync changed keys to localStorage (state already updated optimistically)
        if (changedUpdates.cards !== undefined) localStorage.setItem('gameCards', JSON.stringify(changedUpdates.cards));
        if (changedUpdates.balance !== undefined) localStorage.setItem('gameBalance', String(changedUpdates.balance));
        if (changedUpdates.initialized !== undefined) localStorage.setItem('gameInitialized', String(changedUpdates.initialized));
        if (changedUpdates.inventory !== undefined) localStorage.setItem('gameInventory', JSON.stringify(changedUpdates.inventory));
        if (changedUpdates.marketplaceListings !== undefined) localStorage.setItem('marketplaceListings', JSON.stringify(changedUpdates.marketplaceListings));
        if (changedUpdates.socialQuests !== undefined) localStorage.setItem('socialQuests', JSON.stringify(changedUpdates.socialQuests));
        if (changedUpdates.adventurePlayerStats !== undefined && changedUpdates.adventurePlayerStats) {
          localStorage.setItem('adventurePlayerStats', JSON.stringify(changedUpdates.adventurePlayerStats));
        }
        if (changedUpdates.adventureCurrentMonster !== undefined && changedUpdates.adventureCurrentMonster) {
          localStorage.setItem('adventureCurrentMonster', JSON.stringify(changedUpdates.adventureCurrentMonster));
        }
        if (changedUpdates.dragonEggs !== undefined) localStorage.setItem('dragonEggs', JSON.stringify(changedUpdates.dragonEggs));
        if (changedUpdates.battleState !== undefined && changedUpdates.battleState) {
          localStorage.setItem('battleState', JSON.stringify(changedUpdates.battleState));
        }
        if (changedUpdates.selectedTeam !== undefined) localStorage.setItem('selectedTeam', JSON.stringify(changedUpdates.selectedTeam));

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
      setGameData((prev) => ({ ...prev, balance: 0 }));
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
          console.log('Real-time update:', payload);
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