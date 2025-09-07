import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
// Убираем зависимость от useAuth для работы с кошельками
import { Card } from '@/types/cards';
import { useToast } from '@/hooks/use-toast';
import { processCardsHealthRegeneration, initializeCardHealth } from '@/utils/cardHealthUtils';

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
    dragonLairUpgrades: []
  });
  const [loading, setLoading] = useState(true);

  // Загрузка данных из Supabase для кошелька
  const loadGameData = useCallback(async (walletAddress?: string) => {
    const address = walletAddress || localStorage.getItem('accountId');
    
    if (!address) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('game_data')
        .select('*')
        .eq('wallet_address', address)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading game data:', error);
        setLoading(false);
        return;
      }

      if (data) {
        // Process cards with health initialization and regeneration
        const rawCards = (data.cards as unknown as Card[]) || [];
        const initializedCards = rawCards.map(initializeCardHealth);
        const processedCards = processCardsHealthRegeneration(initializedCards);
        
        const newGameData: GameData = {
          balance: data.balance || 0,
          cards: processedCards,
          initialized: data.initialized || false,
          inventory: ((data as any).inventory as any[]) || [],
          marketplaceListings: ((data as any).marketplace_listings as any[]) || [],
          socialQuests: ((data as any).social_quests as any[]) || [],
          adventurePlayerStats: (data as any).adventure_player_stats || null,
          adventureCurrentMonster: (data as any).adventure_current_monster || null,
          dragonEggs: ((data as any).dragon_eggs as any[]) || [],
          battleState: (data as any).battle_state || null,
          selectedTeam: ((data as any).selected_team as any[]) || [],
          barracksUpgrades: ((data as any).barracks_upgrades as any[]) || [],
          dragonLairUpgrades: ((data as any).dragon_lair_upgrades as any[]) || [],
          accountLevel: (data as any).account_level || 1,
          accountExperience: (data as any).account_experience || 0
        };
        
        setGameData(newGameData);
        
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
      }
    } catch (error) {
      console.error('Error in loadGameData:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Обновление данных в Supabase для кошелька
  const updateGameData = useCallback(async (updates: Partial<GameData>) => {
    const walletAddress = localStorage.getItem('accountId');
    if (!walletAddress) return;

    try {
      // Формируем payload только из переданных полей, чтобы не затирать значения в БД
      const payload: any = { 
        wallet_address: walletAddress,
        user_id: walletAddress // Используем wallet address как user_id для совместимости
      };
      if (updates.balance !== undefined) payload.balance = updates.balance;
      if (updates.cards !== undefined) payload.cards = updates.cards as any;
      if (updates.inventory !== undefined) payload.inventory = updates.inventory as any;
      if (updates.marketplaceListings !== undefined) payload.marketplace_listings = updates.marketplaceListings as any;
      if (updates.socialQuests !== undefined) payload.social_quests = updates.socialQuests as any;
      if (updates.adventurePlayerStats !== undefined) payload.adventure_player_stats = updates.adventurePlayerStats as any;
      if (updates.adventureCurrentMonster !== undefined) payload.adventure_current_monster = updates.adventureCurrentMonster as any;
      if (updates.dragonEggs !== undefined) payload.dragon_eggs = updates.dragonEggs as any;
      if (updates.battleState !== undefined) payload.battle_state = updates.battleState as any;
      if (updates.selectedTeam !== undefined) payload.selected_team = updates.selectedTeam as any;
      if (updates.barracksUpgrades !== undefined) payload.barracks_upgrades = updates.barracksUpgrades as any;
      if (updates.dragonLairUpgrades !== undefined) payload.dragon_lair_upgrades = updates.dragonLairUpgrades as any;
      // ВАЖНО: initialized обновляем только если явно передан
      if (updates.initialized !== undefined) payload.initialized = updates.initialized;

      const { error } = await supabase
        .from('game_data')
        .upsert(payload, { onConflict: 'user_id' });

      if (error) {
        console.error('Error updating game data:', error);
        toast({
          title: "Ошибка сохранения",
          description: "Не удалось сохранить данные игры",
          variant: "destructive"
        });
        return;
      }

      // Локально также не трогаем initialized, если он не был в updates
      setGameData((prev) => ({ ...prev, ...updates }));

      // Синхронизируем только изменённые ключи в localStorage
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

    } catch (error) {
      console.error('Error in updateGameData:', error);
    }
  }, [toast]);

  // Загружаем данные при инициализации
  useEffect(() => {
    loadGameData();
  }, [loadGameData]);

  // Подписка на изменения в реальном времени для кошелька
  useEffect(() => {
    const walletAddress = localStorage.getItem('accountId');
    if (!walletAddress) return;

    const channel = supabase
      .channel('game-data-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'game_data',
          filter: `wallet_address=eq.${walletAddress}`
        },
        (payload) => {
          console.log('Real-time update:', payload);
          loadGameData(walletAddress);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadGameData]);

  return {
    gameData,
    loading,
    updateGameData,
    loadGameData
  };
};