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
import { useGameEvent } from '@/contexts/GameEventsContext';

interface GameData {
  balance: number;
  mgtBalance: number;
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
  mgtBalance: 0,
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
    forge: 0,
    clan_hall: 0
  },
  activeBuildingUpgrades: []
};

// Cleanup obsolete large localStorage keys (one-time)
const cleanupObsoleteLocalStorage = () => {
  const obsoleteKeys = [
    'gameCards', 'marketplaceListings', 'socialQuests', 
    'adventurePlayerStats', 'adventureCurrentMonster',
    'gameBalance', 'gameInitialized', 'gameInventory', 'gameDragonEggs',
    'game-storage', 'gameSelectedTeam', 'game_balance', 'game_cards',
    'game_inventory', 'game_dragonEggs', 'game_selectedTeam',
    'game_accountLevel', 'game_accountExperience',
    // Добавлены новые устаревшие ключи после рефакторинга
    'activeWorkers', 'battleState', 'teamBattleState', 'activeBattleInProgress',
    'adventurePlayerStats', 'legacyBattleState'
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
      if (import.meta.env.DEV) console.log('🎯 [GameDataContext] QUERY FUNCTION CALLED, accountId:', accountId);
      const address = accountId || localStorage.getItem('walletAccountId');
      
      if (!address) {
        return DEFAULT_GAME_DATA;
      }

      let gameDataArray = await loadGameDataDeduped(address);

      // If no data exists, create initial record with 100 ELL
      if (!gameDataArray || gameDataArray.length === 0) {
        if (import.meta.env.DEV) console.log('✨ No game data found, creating new player with 100 ELL...');
        try {
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

          if (import.meta.env.DEV) console.log('✅ Created new player, user_id:', userId);
          
          await new Promise(resolve => setTimeout(resolve, 500));
          gameDataArray = await loadGameDataDeduped(address);
          
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
          mgtBalance: (gameRecord as any).mgt_balance || 0,
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
            if (import.meta.env.DEV) console.log('🏗️ [GameDataContext] Parsing building_levels:', levels);
            
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
                forge: levels.forge ?? 0,
                clan_hall: levels.clan_hall ?? 0
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
              forge: 0,
              clan_hall: 0
            };
          })(),
          activeBuildingUpgrades: (gameRecord.active_building_upgrades as any[]) || []
        };
        
        // OPTIMIZATION: Полностью убрали localStorage sync - данные только в React Query и Supabase
        // Это устраняет security warning "Invalid localStorage data: gameBalance"
        
        
        return newGameData;
      }

      return DEFAULT_GAME_DATA;
    },
    enabled: !!accountId,
    staleTime: 30 * 60 * 1000, // 30 минут - агрессивное кеширование (было 10 мин)
    gcTime: 60 * 60 * 1000, // 60 минут (было 30 мин)
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false, // Не перезагружать при каждом монтировании
    retry: 1,
  });

  // Real-time subscription for game_data changes
  useEffect(() => {
    if (!accountId) return;

    if (import.meta.env.DEV) console.log('🔔 [GameDataContext] Setting up Real-time subscription for game_data');

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
          if (import.meta.env.DEV) console.log('🔔 [GameDataContext] game_data updated:', payload);
          queryClient.invalidateQueries({ queryKey: ['gameData', accountId] });
        }
      )
      .subscribe();

    return () => {
      if (import.meta.env.DEV) console.log('🔄 [GameDataContext] Cleaning up Real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [accountId, queryClient]);

  // Listen for admin force refetch commands via GameEventsContext
  useGameEvent('gameDataForceRefetch', (payload) => {
    if (!payload?.wallet || !accountId) return;
    if (payload.wallet.toLowerCase().trim() === accountId.toLowerCase().trim()) {
      if (import.meta.env.DEV) console.log('✅ [GameDataContext] Refetching after admin update');
      refetch();
    }
  }, [refetch, accountId]);

  const updateGameData = useCallback(async (updates: Partial<GameData>) => {
    const address = accountId || localStorage.getItem('walletAccountId');
    if (!address) {
      console.error('❌ No wallet address for updateGameData');
      return;
    }

    if (import.meta.env.DEV) console.log('💾 Updating game data:', Object.keys(updates));

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
      
      // OPTIMIZATION: Убрали localStorage sync - данные только в React Query и Supabase
      
      
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
    if (import.meta.env.DEV) console.log('🔄 [GameDataContext] Manual reload triggered');
    const result = await refetch({ cancelRefetch: true });
    if (import.meta.env.DEV) console.log('✅ [GameDataContext] Refetch completed, success:', result.isSuccess);
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
