import React, { createContext, useContext, ReactNode, useState, useCallback, useRef, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useWalletContext } from '@/contexts/WalletConnectContext';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/types/cards';
import { loadGameDataDeduped } from '@/utils/gameDataLoader';
import { updateGameDataByWalletThrottled } from '@/utils/updateGameDataThrottle';
import { localStorageBatcher } from '@/utils/localStorageBatcher';
import { normalizeCardsHealth } from '@/utils/cardHealthNormalizer';
import { supabase } from '@/integrations/supabase/client';

interface GameData {
  balance: number;
  cards: Card[];
  initialized: boolean;
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
  buildingLevels?: any;
  activeBuildingUpgrades?: any[];
  wood?: number;
  stone?: number;
  iron?: number;
  gold?: number;
}

interface GameDataContextType {
  gameData: GameData;
  loading: boolean;
  updateGameData: (updates: Partial<GameData>) => Promise<void>;
  loadGameData: (walletAddress?: string) => Promise<void>;
}

const GameDataContext = createContext<GameDataContextType | undefined>(undefined);

const DEFAULT_GAME_DATA: GameData = {
  balance: 0,
  cards: [],
  initialized: false,
  marketplaceListings: [],
  socialQuests: [],
  adventurePlayerStats: null,
  adventureCurrentMonster: null,
  dragonEggs: [],
  battleState: null,
  selectedTeam: [],
  barracksUpgrades: [],
  dragonLairUpgrades: [],
  activeWorkers: [],
  wood: 0,
  stone: 0,
  iron: 0,
  gold: 0,
  buildingLevels: {
    main_hall: 0,
    workshop: 0,
    storage: 0,
    sawmill: 0,
    quarry: 0,
    barracks: 0,
    dragon_lair: 0,
    medical: 0,
    forge: 0
  },
  activeBuildingUpgrades: []
};

// Cleanup obsolete large localStorage keys (one-time)
const cleanupObsoleteLocalStorage = () => {
  const obsoleteKeys = [
    'gameCards', 'marketplaceListings', 'socialQuests', 
    'adventurePlayerStats', 'adventureCurrentMonster'
  ];
  obsoleteKeys.forEach(key => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      // Ignore cleanup errors
    }
  });
};

export const GameDataProvider = ({ children }: { children: ReactNode }) => {
  const { accountId } = useWalletContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const lastUpdateRef = useRef<number>(Date.now());

  // One-time cleanup of obsolete localStorage keys
  useEffect(() => {
    cleanupObsoleteLocalStorage();
  }, []);

  const { 
    data: gameData = DEFAULT_GAME_DATA, 
    isLoading: loading,
    refetch
  } = useQuery({
    queryKey: ['gameData', accountId],
    queryFn: async () => {
      console.log('🎯🎯🎯 [GameDataContext] ========== QUERY FUNCTION CALLED ==========');
      console.log('🎯 [GameDataContext] accountId:', accountId);
      console.log('🎯 [GameDataContext] timestamp:', new Date().toISOString());
      const address = accountId || localStorage.getItem('walletAccountId');
      console.log('🎯 [GameDataContext] resolved address:', address);
      
      if (!address) {
        console.log('⚠️ [GameDataContext] No address available, returning default data');
        return DEFAULT_GAME_DATA;
      }

      console.log('🔍 Loading game data for:', address);
      let gameDataArray = await loadGameDataDeduped(address);
      console.log('📦 [GameDataContext] Loaded data array length:', gameDataArray?.length);

      // If no data exists, create initial record with 100 ELL
      if (!gameDataArray || gameDataArray.length === 0) {
        console.log('✨ No game data found, creating new player with 100 ELL...');
        try {
          console.log('🔧 [GameDataContext] Calling ensure_game_data_exists for:', address);
          const { data: userId, error } = await supabase.rpc('ensure_game_data_exists', {
            p_wallet_address: address
          });

          if (error) {
            console.error('❌ Error creating game data:', error);
            toast({
              title: "Ошибка создания игрока",
              description: "Не удалось создать данные. Попробуйте переподключить кошелек.",
              variant: "destructive"
            });
            return DEFAULT_GAME_DATA;
          }

          console.log('✅ Created new player, user_id:', userId);
          
          // Reload data after creation with small delay to ensure DB propagation
          await new Promise(resolve => setTimeout(resolve, 500));
          gameDataArray = await loadGameDataDeduped(address);
          console.log('📦 [GameDataContext] Reloaded data array length:', gameDataArray?.length);
          
          if (gameDataArray && gameDataArray.length > 0) {
            toast({
              title: "Добро пожаловать!",
              description: "Вы получили 100 ELL для начала игры!"
            });
          }
        } catch (error) {
          console.error('❌ Failed to initialize player:', error);
          return DEFAULT_GAME_DATA;
        }
      }

      if (gameDataArray && gameDataArray.length > 0) {
        const gameRecord = gameDataArray[0];
        
        const rawCards = (gameRecord.cards as unknown as Card[]) || [];
        const normalizedCards = normalizeCardsHealth(rawCards);
        
        const hadCorruptedHealth = rawCards.some((card, i) => 
          card.health !== normalizedCards[i].health
        );
        
        if (hadCorruptedHealth) {
          console.log('🔧 Found corrupted health values, fixing in database...');
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
          activeWorkers: (gameRecord.active_workers as any[]) || [],
          wood: gameRecord.wood || 0,
          stone: gameRecord.stone || 0,
          iron: gameRecord.iron || 0,
          gold: gameRecord.gold || 0,
          buildingLevels: (() => {
            const levels = gameRecord.building_levels as any;
            console.log('🏗️ [GameDataContext] Parsing building_levels:', levels);
            
            // Если levels валидный объект с данными, возвращаем его
            if (levels && typeof levels === 'object' && Object.keys(levels).length > 0) {
              return {
                main_hall: levels.main_hall ?? 0,
                workshop: levels.workshop ?? 0,
                storage: levels.storage ?? 0,
                sawmill: levels.sawmill ?? 0,
                quarry: levels.quarry ?? 0,
                barracks: levels.barracks ?? 0,
                dragon_lair: levels.dragon_lair ?? 0,
                medical: levels.medical ?? 0,
                forge: levels.forge ?? 0
              };
            }
            
            // Fallback на дефолтные значения
            console.warn('⚠️ [GameDataContext] Building levels empty or invalid, using defaults');
            return {
              main_hall: 0,
              workshop: 0,
              storage: 0,
              sawmill: 0,
              quarry: 0,
              barracks: 0,
              dragon_lair: 0,
              medical: 0,
              forge: 0
            };
          })(),
          activeBuildingUpgrades: (gameRecord.active_building_upgrades as any[]) || []
        };
        
        // OPTIMIZATION: Removed localStorage sync for large objects (cards, marketplaceListings, etc.)
        // These are already cached in React Query - no need to duplicate in localStorage
        // Only store minimal essential data
        localStorageBatcher.setItem('gameBalance', newGameData.balance.toString());
        localStorageBatcher.setItem('gameInitialized', newGameData.initialized.toString());
        
        return newGameData;
      }

      return DEFAULT_GAME_DATA;
    },
    enabled: !!accountId,
    staleTime: 10 * 60 * 1000, // 10 минут - синхронизировано с useUnifiedGameState
    gcTime: 30 * 60 * 1000, // 30 минут - синхронизировано с useUnifiedGameState
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false, // Не перезагружать при каждом монтировании
    retry: 1,
  });

  // Real-time subscription for game_data changes
  useEffect(() => {
    if (!accountId) return;

    console.log('🔔 [GameDataContext] Setting up Real-time subscription for game_data');

    const channel = supabase
      .channel('game-data-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'game_data',
          filter: `wallet_address=eq.${accountId}`
        },
        (payload) => {
          console.log('🔔 [GameDataContext] game_data updated:', payload);
          queryClient.invalidateQueries({ queryKey: ['gameData', accountId] });
        }
      )
      .subscribe();

    return () => {
      console.log('🔄 [GameDataContext] Cleaning up Real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [accountId, queryClient]);

  // Listen for wallet changes and refetch data
  useEffect(() => {
    const handleWalletChange = () => {
      console.log('🔄 [GameDataContext] Wallet changed, refetching data');
      refetch();
    };

    const handleForceRefetch = (e: CustomEvent) => {
      console.log('🔄 [GameDataContext] Force refetch requested for wallet:', e.detail?.wallet);
      if (!e.detail?.wallet || !accountId) return;
      
      // Проверяем, что это наш кошелек (с учетом регистра)
      if (e.detail.wallet.toLowerCase().trim() === accountId.toLowerCase().trim()) {
        console.log('✅ [GameDataContext] Refetching game data after admin update');
        refetch();
      }
    };

    window.addEventListener('wallet-changed', handleWalletChange);
    window.addEventListener('gameData:forceRefetch', handleForceRefetch as EventListener);
    return () => {
      window.removeEventListener('wallet-changed', handleWalletChange);
      window.removeEventListener('gameData:forceRefetch', handleForceRefetch as EventListener);
    };
  }, [refetch, accountId]);

  const updateGameData = useCallback(async (updates: Partial<GameData>) => {
    const address = accountId || localStorage.getItem('walletAccountId');
    if (!address) {
      console.error('❌ No wallet address for updateGameData');
      return;
    }

    console.log('💾 Updating game data:', Object.keys(updates));

    // Optimistically update cache
    queryClient.setQueryData(['gameData', accountId], (old: GameData = DEFAULT_GAME_DATA) => ({
      ...old,
      ...updates
    }));

    // Update in database
    try {
      await updateGameDataByWalletThrottled({
        p_wallet_address: address,
        ...updates as any
      });
      
      // Sync only essential small data to localStorage
      Object.entries(updates).forEach(([key, value]) => {
        if (key === 'balance') localStorageBatcher.setItem('gameBalance', value.toString());
        if (key === 'initialized') localStorageBatcher.setItem('gameInitialized', value.toString());
      });
      
      lastUpdateRef.current = Date.now();
    } catch (error) {
      console.error('❌ Error updating game data:', error);
      toast({
        title: 'Ошибка сохранения',
        description: 'Не удалось сохранить данные игры',
        variant: 'destructive'
      });
      // Revert optimistic update on error
      queryClient.invalidateQueries({ queryKey: ['gameData', accountId] });
    }
  }, [accountId, queryClient, toast]);

  const loadGameDataManual = useCallback(async (walletAddress?: string) => {
    console.log('🔄🔄🔄 [GameDataContext] ========== MANUAL RELOAD TRIGGERED ==========');
    console.log('🔄 [GameDataContext] walletAddress:', walletAddress);
    console.log('🔄 [GameDataContext] accountId:', accountId);
    console.log('🔄 [GameDataContext] timestamp:', new Date().toISOString());
    
    // КРИТИЧНО: Используем cancelRefetch: true чтобы принудительно перезагрузить данные
    // игнорируя staleTime кеш
    console.log('🔄 [GameDataContext] Calling refetch with cancelRefetch: true...');
    const result = await refetch({ cancelRefetch: true });
    
    console.log('✅✅✅ [GameDataContext] ========== REFETCH COMPLETED ==========');
    console.log('✅ [GameDataContext] isSuccess:', result.isSuccess);
    console.log('✅ [GameDataContext] isError:', result.isError);
    console.log('✅ [GameDataContext] buildingLevels:', result.data?.buildingLevels);
    console.log('✅ [GameDataContext] timestamp:', new Date().toISOString());
  }, [refetch, accountId]);

  return (
    <GameDataContext.Provider value={{ 
      gameData, 
      loading, 
      updateGameData,
      loadGameData: loadGameDataManual
    }}>
      {children}
    </GameDataContext.Provider>
  );
};

export const useGameDataContext = () => {
  const context = useContext(GameDataContext);
  if (context === undefined) {
    throw new Error('useGameDataContext must be used within GameDataProvider');
  }
  return context;
};
