import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useWallet } from '@/hooks/useWallet';
import { v4 as uuidv4 } from 'uuid';
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
  const { accountId, isConnected } = useWallet();
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

  // Загрузка данных из Supabase
  const loadGameData = useCallback(async () => {
    if (!accountId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('game_data')
        .select('*')
        .eq('wallet_address', accountId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading game data:', error);
        setLoading(false);
        return;
      }

      let row = data as any | null;

      if (!row) {
        const newId = uuidv4();
        const { data: inserted, error: insertError } = await supabase
          .from('game_data')
          .insert({
            user_id: newId,
            wallet_address: accountId,
            balance: 100,
            initialized: true,
            cards: [],
            inventory: [],
            marketplace_listings: [],
            social_quests: [],
            adventure_player_stats: null,
            adventure_current_monster: null,
            dragon_eggs: [],
            battle_state: null,
            selected_team: [],
            barracks_upgrades: [],
            dragon_lair_upgrades: [],
            account_level: 1,
            account_experience: 0
          })
          .select('*')
          .maybeSingle();

        if (insertError) {
          console.error('Error creating game data:', insertError);
          setLoading(false);
          return;
        }
        row = inserted as any;
      }

      const rawCards = (row.cards as unknown as Card[]) || [];
      const initializedCards = rawCards.map(initializeCardHealth);
      const processedCards = processCardsHealthRegeneration(initializedCards);
      
      const newGameData: GameData = {
        balance: row.balance || 0,
        cards: processedCards,
        initialized: row.initialized || false,
        inventory: (row.inventory as any[]) || [],
        marketplaceListings: (row.marketplace_listings as any[]) || [],
        socialQuests: (row.social_quests as any[]) || [],
        adventurePlayerStats: row.adventure_player_stats || null,
        adventureCurrentMonster: row.adventure_current_monster || null,
        dragonEggs: (row.dragon_eggs as any[]) || [],
        battleState: row.battle_state || null,
        selectedTeam: (row.selected_team as any[]) || [],
        barracksUpgrades: (row.barracks_upgrades as any[]) || [],
        dragonLairUpgrades: (row.dragon_lair_upgrades as any[]) || [],
        accountLevel: row.account_level || 1,
        accountExperience: row.account_experience || 0
      };
      
      setGameData(newGameData);
      
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
    } catch (error) {
      console.error('Error in loadGameData:', error);
    } finally {
      setLoading(false);
    }
  }, [accountId]);

  // Обновление данных в Supabase
  const updateGameData = useCallback(async (updates: Partial<GameData>) => {
    if (!accountId) return;

    try {
      // Build payload only with provided fields
      const payload: any = {};
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
      if (updates.initialized !== undefined) payload.initialized = updates.initialized;

      // Check if row exists
      const { data: existing } = await supabase
        .from('game_data')
        .select('id')
        .eq('wallet_address', accountId)
        .maybeSingle();

      let dbError = null as any;
      if (existing) {
        const { error } = await supabase
          .from('game_data')
          .update(payload)
          .eq('wallet_address', accountId);
        dbError = error;
      } else {
        const { error } = await supabase
          .from('game_data')
          .insert({
            user_id: uuidv4(),
            wallet_address: accountId,
            ...payload,
          });
        dbError = error;
      }

      if (dbError) {
        console.error('Error updating game data:', dbError);
        toast({
          title: 'Ошибка сохранения',
          description: 'Не удалось сохранить данные игры',
          variant: 'destructive'
        });
        return;
      }

      setGameData((prev) => ({ ...prev, ...updates }));

      // Sync only changed keys to localStorage
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

      // Dispatch UI update events
      if (updates.balance !== undefined) {
        const balanceEvent = new CustomEvent('balanceUpdate', { detail: { balance: updates.balance } });
        window.dispatchEvent(balanceEvent);
      }
      if (updates.cards !== undefined) {
        const cardsEvent = new CustomEvent('cardsUpdate', { detail: { cards: updates.cards } });
        window.dispatchEvent(cardsEvent);
      }
    } catch (error) {
      console.error('Error in updateGameData:', error);
    }
  }, [accountId, toast]);

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