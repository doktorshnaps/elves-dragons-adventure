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
      
      // First try to get existing data using the new function
      const { data: functionData, error: functionError } = await supabase.rpc('initialize_game_data_by_wallet', {
        p_wallet_address: address
      });

      if (functionError) {
        console.error('❌ Error from function:', functionError);
        setLoading(false);
        return;
      }

      if (functionData && functionData.length > 0) {
        const gameRecord = functionData[0];
        console.log('✅ Game data loaded from function:', gameRecord);
        
        // Process cards with health initialization and regeneration
        const rawCards = (gameRecord.cards as unknown as Card[]) || [];
        const initializedCards = rawCards.map(initializeCardHealth);
        const processedCards = processCardsHealthRegeneration(initializedCards);
        
        const newGameData: GameData = {
          balance: gameRecord.balance || 100,
          cards: processedCards,
          initialized: true,
          inventory: (gameRecord.inventory as any[]) || [],
          marketplaceListings: [],
          socialQuests: [],
          adventurePlayerStats: null,
          adventureCurrentMonster: null,
          dragonEggs: (gameRecord.dragon_eggs as any[]) || [],
          battleState: null,
          selectedTeam: (gameRecord.selected_team as any[]) || [],
          barracksUpgrades: [],
          dragonLairUpgrades: [],
          accountLevel: gameRecord.account_level || 1,
          accountExperience: gameRecord.account_experience || 0
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
        
        console.log('📦 Game data synced to localStorage');
      } else {
        console.log('⚠️ No data from function, trying direct query...');
        
        // Fallback to direct query if function returns no data
        const { data: directData, error: directError } = await supabase
          .from('game_data')
          .select('*')
          .eq('wallet_address', address)
          .maybeSingle();

        if (directError) {
          console.error('❌ Error from direct query:', directError);
          setLoading(false);
          return;
        }

        if (directData) {
          console.log('✅ Game data loaded from direct query:', directData);
          
          // Process cards with health initialization and regeneration
          const rawCards = (directData.cards as unknown as Card[]) || [];
          const initializedCards = rawCards.map(initializeCardHealth);
          const processedCards = processCardsHealthRegeneration(initializedCards);
          
          const newGameData: GameData = {
            balance: directData.balance || 0,
            cards: processedCards,
            initialized: directData.initialized || false,
            inventory: ((directData as any).inventory as any[]) || [],
            marketplaceListings: ((directData as any).marketplace_listings as any[]) || [],
            socialQuests: ((directData as any).social_quests as any[]) || [],
            adventurePlayerStats: (directData as any).adventure_player_stats || null,
            adventureCurrentMonster: (directData as any).adventure_current_monster || null,
            dragonEggs: ((directData as any).dragon_eggs as any[]) || [],
            battleState: (directData as any).battle_state || null,
            selectedTeam: ((directData as any).selected_team as any[]) || [],
            barracksUpgrades: ((directData as any).barracks_upgrades as any[]) || [],
            dragonLairUpgrades: ((directData as any).dragon_lair_upgrades as any[]) || [],
            accountLevel: (directData as any).account_level || 1,
            accountExperience: (directData as any).account_experience || 0
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
          
          console.log('📦 Game data synced to localStorage from direct query');
        } else {
          console.log('⚠️ No game data found at all');
        }
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

    try {
      // Формируем payload только из переданных полей, чтобы не затирать значения в БД
      const payload: any = { 
        wallet_address: walletAddress,
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

      // Существующая запись?
      const { data: existing, error: selErr } = await supabase
        .from('game_data')
        .select('id')
        .eq('wallet_address', walletAddress)
        .maybeSingle();
      if (selErr) throw selErr;

      let error: any = null;
      if (existing) {
        const res = await supabase.from('game_data').update(payload).eq('wallet_address', walletAddress);
        error = res.error;
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.warn('No Supabase user session; skipping game_data insert');
          return;
        }
        const res = await supabase.from('game_data').insert({ ...payload, user_id: user.id });
        error = res.error;
      }


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