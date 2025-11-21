import React, { createContext, useContext, ReactNode, useState, useCallback, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useWalletContext } from '@/contexts/WalletConnectContext';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/types/cards';
import { loadGameDataDeduped } from '@/utils/gameDataLoader';
import { updateGameDataByWalletThrottled } from '@/utils/updateGameDataThrottle';
import { localStorageBatcher } from '@/utils/localStorageBatcher';
import { normalizeCardsHealth } from '@/utils/cardHealthNormalizer';

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
  activeWorkers: []
};

export const GameDataProvider = ({ children }: { children: ReactNode }) => {
  const { accountId } = useWalletContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const lastUpdateRef = useRef<number>(Date.now());

  const { 
    data: gameData = DEFAULT_GAME_DATA, 
    isLoading: loading,
    refetch
  } = useQuery({
    queryKey: ['gameData', accountId],
    queryFn: async () => {
      const address = accountId || localStorage.getItem('walletAccountId');
      
      if (!address) {
        return DEFAULT_GAME_DATA;
      }

      const gameDataArray = await loadGameDataDeduped(address);

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
          activeWorkers: (gameRecord.active_workers as any[]) || []
        };
        
        // Sync to localStorage via batcher
        localStorageBatcher.setItem('gameCards', newGameData.cards);
        localStorageBatcher.setItem('gameBalance', newGameData.balance.toString());
        localStorageBatcher.setItem('gameInitialized', newGameData.initialized.toString());
        localStorageBatcher.setItem('marketplaceListings', newGameData.marketplaceListings);
        localStorageBatcher.setItem('socialQuests', newGameData.socialQuests);
        if (newGameData.adventurePlayerStats) {
          localStorageBatcher.setItem('adventurePlayerStats', newGameData.adventurePlayerStats);
        }
        if (newGameData.adventureCurrentMonster) {
          localStorageBatcher.setItem('adventureCurrentMonster', newGameData.adventureCurrentMonster);
        }
        
        return newGameData;
      }

      return DEFAULT_GAME_DATA;
    },
    enabled: !!accountId,
    staleTime: 10 * 1000, // 10 seconds
    gcTime: 60 * 1000, // 1 minute
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

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
      
      // Sync to localStorage
      Object.entries(updates).forEach(([key, value]) => {
        if (key === 'cards') localStorageBatcher.setItem('gameCards', value);
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
    console.log('🔄 Manual game data reload triggered for wallet:', walletAddress || accountId);
    // Note: walletAddress parameter is ignored for now, using accountId from context
    await refetch();
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
