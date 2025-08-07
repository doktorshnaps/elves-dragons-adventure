import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/types/cards';
import { useToast } from '@/hooks/use-toast';

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
}

export const useGameData = () => {
  const { user } = useAuth();
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
    selectedTeam: []
  });
  const [loading, setLoading] = useState(true);

  // Загрузка данных из Supabase
  const loadGameData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('game_data')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading game data:', error);
        setLoading(false);
        return;
      }

      if (data) {
        const newGameData: GameData = {
          balance: data.balance || 0,
          cards: (data.cards as unknown as Card[]) || [],
          initialized: data.initialized || false,
          inventory: ((data as any).inventory as any[]) || [],
          marketplaceListings: ((data as any).marketplace_listings as any[]) || [],
          socialQuests: ((data as any).social_quests as any[]) || [],
          adventurePlayerStats: (data as any).adventure_player_stats || null,
          adventureCurrentMonster: (data as any).adventure_current_monster || null,
          dragonEggs: ((data as any).dragon_eggs as any[]) || [],
          battleState: (data as any).battle_state || null,
          selectedTeam: ((data as any).selected_team as any[]) || []
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
  }, [user]);

  // Обновление данных в Supabase
  const updateGameData = useCallback(async (updates: Partial<GameData>) => {
    if (!user) return;

    try {
      const updatedData = { ...gameData, ...updates };
      
      const { error } = await supabase
        .from('game_data')
        .upsert({
          user_id: user.id,
          balance: updatedData.balance,
          cards: updatedData.cards as any,
          initialized: updatedData.initialized,
          inventory: updatedData.inventory as any,
          marketplace_listings: updatedData.marketplaceListings as any,
          social_quests: updatedData.socialQuests as any,
          adventure_player_stats: updatedData.adventurePlayerStats as any,
          adventure_current_monster: updatedData.adventureCurrentMonster as any,
          dragon_eggs: updatedData.dragonEggs as any,
          battle_state: updatedData.battleState as any,
          selected_team: updatedData.selectedTeam as any
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Error updating game data:', error);
        toast({
          title: "Ошибка сохранения",
          description: "Не удалось сохранить данные игры",
          variant: "destructive"
        });
        return;
      }

      setGameData(updatedData);
      
      // Синхронизируем с localStorage
      localStorage.setItem('gameCards', JSON.stringify(updatedData.cards));
      localStorage.setItem('gameBalance', updatedData.balance.toString());
      localStorage.setItem('gameInitialized', updatedData.initialized.toString());
      localStorage.setItem('gameInventory', JSON.stringify(updatedData.inventory));
      localStorage.setItem('marketplaceListings', JSON.stringify(updatedData.marketplaceListings));
      localStorage.setItem('socialQuests', JSON.stringify(updatedData.socialQuests));
      if (updatedData.adventurePlayerStats) {
        localStorage.setItem('adventurePlayerStats', JSON.stringify(updatedData.adventurePlayerStats));
      }
      if (updatedData.adventureCurrentMonster) {
        localStorage.setItem('adventureCurrentMonster', JSON.stringify(updatedData.adventureCurrentMonster));
      }
      localStorage.setItem('dragonEggs', JSON.stringify(updatedData.dragonEggs));
      if (updatedData.battleState) {
        localStorage.setItem('battleState', JSON.stringify(updatedData.battleState));
      }
      localStorage.setItem('selectedTeam', JSON.stringify(updatedData.selectedTeam));

      // Отправляем события для обновления UI
      if (updates.balance !== undefined) {
        const balanceEvent = new CustomEvent('balanceUpdate', { 
          detail: { balance: updatedData.balance }
        });
        window.dispatchEvent(balanceEvent);
      }

      if (updates.cards) {
        const cardsEvent = new CustomEvent('cardsUpdate', { 
          detail: { cards: updatedData.cards }
        });
        window.dispatchEvent(cardsEvent);
      }

    } catch (error) {
      console.error('Error in updateGameData:', error);
    }
  }, [user, gameData, toast]);

  // Загружаем данные при инициализации
  useEffect(() => {
    loadGameData();
  }, [loadGameData]);

  // Подписка на изменения в реальном времени
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('game-data-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'game_data',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Real-time update:', payload);
          loadGameData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, loadGameData]);

  return {
    gameData,
    loading,
    updateGameData,
    loadGameData
  };
};