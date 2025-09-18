import { useState, useEffect, useCallback } from 'react';
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
        
        // Process cards with health initialization but preserve existing health values
        const rawCards = (gameRecord.cards as unknown as Card[]) || [];
        // Только инициализируем поля для новых карт, но сохраняем текущее здоровье
        const initializedCards = rawCards.map(card => ({
          ...card,
          lastHealTime: card.lastHealTime ?? Date.now()
          // НЕ сбрасываем currentHealth здесь!
        }));
        // Убираем пассивное восстановление - только инициализируем карты
        
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

  // Обновление данных в Supabase для кошелька
  const updateGameData = useCallback(async (updates: Partial<GameData>) => {
    const walletAddress = localStorage.getItem('walletAccountId');
    if (!walletAddress) return;

    // Optimistic UI update: apply changes immediately
    const prevSnapshot = gameData;
    setGameData((prev) => ({ ...prev, ...updates }));

    try {
      console.log('🔄 Updating game data:', updates);
      
      // Use the secure function to update game data
      const { data: success, error } = await supabase.rpc('update_game_data_by_wallet', {
        p_wallet_address: walletAddress,
        p_balance: updates.balance,
        p_cards: updates.cards as any,
        p_inventory: updates.inventory as any,
        p_selected_team: updates.selectedTeam as any,
        p_dragon_eggs: updates.dragonEggs as any,
        p_account_level: updates.accountLevel,
        p_account_experience: updates.accountExperience,
        p_initialized: updates.initialized,
        p_marketplace_listings: updates.marketplaceListings as any,
        p_social_quests: updates.socialQuests as any,
        p_adventure_player_stats: updates.adventurePlayerStats as any,
        p_adventure_current_monster: updates.adventureCurrentMonster as any,
        p_battle_state: updates.battleState as any,
        p_barracks_upgrades: updates.barracksUpgrades as any,
        p_dragon_lair_upgrades: updates.dragonLairUpgrades as any
      });

      if (error) {
        console.error('❌ Error updating game data:', error);
        // Rollback optimistic update
        setGameData(prevSnapshot);
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
        if (updates.cards !== undefined) localStorage.setItem('gameCards', JSON.stringify(updates.cards));
        if (updates.balance !== undefined) localStorage.setItem('gameBalance', String(updates.balance));
        if (updates.initialized !== undefined) localStorage.setItem('gameInitialized', String(updates.initialized));
        if (updates.inventory !== undefined) localStorage.setItem('gameInventory', JSON.stringify(updates.inventory));
        if (updates.marketplaceListings !== undefined) localStorage.setItem('marketplaceListings', JSON.stringify(updates.marketplaceListings));
        if (updates.socialQuests !== undefined) localStorage.setItem('socialQuests', JSON.stringify(updates.socialQuests));
        if (updates.adventurePlayerStats !== undefined && updates.adventurePlayerStats) {
          localStorage.setItem('adventurePlayerStats', JSON.stringify(updates.adventurePlayerStats));
        }
        if (updates.adventureCurrentMonster !== undefined && updates.adventureCurrentMonster) {
          localStorage.setItem('adventureCurrentMonster', JSON.stringify(updates.adventureCurrentMonster));
        }
        if (updates.dragonEggs !== undefined) localStorage.setItem('dragonEggs', JSON.stringify(updates.dragonEggs));
        if (updates.battleState !== undefined && updates.battleState) {
          localStorage.setItem('battleState', JSON.stringify(updates.battleState));
        }
        if (updates.selectedTeam !== undefined) localStorage.setItem('selectedTeam', JSON.stringify(updates.selectedTeam));

        // Maintain a full 'gameData' snapshot for components expecting snake_case
        try {
          const raw = localStorage.getItem('gameData');
          const gd = raw ? JSON.parse(raw) : {};
          if (updates.cards !== undefined) gd.cards = updates.cards;
          if (updates.balance !== undefined) gd.balance = updates.balance;
          if (updates.initialized !== undefined) gd.initialized = updates.initialized;
          if (updates.inventory !== undefined) gd.inventory = updates.inventory;
          if (updates.marketplaceListings !== undefined) gd.marketplace_listings = updates.marketplaceListings;
          if (updates.socialQuests !== undefined) gd.social_quests = updates.socialQuests;
          if (updates.adventurePlayerStats !== undefined) gd.adventure_player_stats = updates.adventurePlayerStats;
          if (updates.adventureCurrentMonster !== undefined) gd.adventure_current_monster = updates.adventureCurrentMonster;
          if (updates.dragonEggs !== undefined) gd.dragon_eggs = updates.dragonEggs;
          if (updates.battleState !== undefined) gd.battle_state = updates.battleState;
          if (updates.selectedTeam !== undefined) gd.selected_team = updates.selectedTeam;
          if (updates.barracksUpgrades !== undefined) gd.barracks_upgrades = updates.barracksUpgrades;
          if (updates.dragonLairUpgrades !== undefined) gd.dragon_lair_upgrades = updates.dragonLairUpgrades;
          if (updates.accountLevel !== undefined) gd.account_level = updates.accountLevel;
          if (updates.accountExperience !== undefined) gd.account_experience = updates.accountExperience;
          localStorage.setItem('gameData', JSON.stringify(gd));
        } catch {}
        // Отправляем события для обновления UI
        if (updates.balance !== undefined) {
          const balanceEvent = new CustomEvent('balanceUpdate', { 
            detail: { balance: updates.balance }
          });
          window.dispatchEvent(balanceEvent);
        }

        if (updates.cards !== undefined) {
          const cardsEvent = new CustomEvent('cardsUpdate', { 
            detail: { cards: updates.cards }
          });
          window.dispatchEvent(cardsEvent);
        }
      }

    } catch (error) {
      console.error('Error in updateGameData:', error);
      // Rollback optimistic update on unexpected errors
      setGameData(prevSnapshot);
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