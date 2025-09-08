import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useWallet } from './useWallet';
import { useOptimisticUpdates } from './useOptimisticUpdates';
import { useRealTimeSync } from './useRealTimeSync';
import { useVersioning } from './useVersioning';
import { useErrorHandling } from './useErrorHandling';
import { batchUpdateManager } from '@/utils/batchUpdates';
import { GameData, UnifiedGameState } from '@/types/gameState';
import { useToast } from './use-toast';

const GAME_DATA_KEY = 'gameData';
const STALE_TIME = 5 * 60 * 1000; // 5 минут
const CACHE_TIME = 10 * 60 * 1000; // 10 минут

const initialGameData: GameData = {
  balance: 100,
  cards: [],
  initialized: false,
  inventory: [],
  dragonEggs: [],
  selectedTeam: [],
  battleState: null,
  marketplaceListings: [],
  socialQuests: [],
  adventurePlayerStats: null,
  adventureCurrentMonster: null,
  barracksUpgrades: [],
  dragonLairUpgrades: [],
  accountLevel: 1,
  accountExperience: 0
};

export const useUnifiedGameState = (): UnifiedGameState => {
  const { accountId } = useWallet();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { updateWithVersionCheck, getRecordVersion } = useVersioning();
  const { withErrorHandling, retryOperation } = useErrorHandling();

  // Основной запрос данных игры
  const {
    data: gameData = initialGameData,
    isLoading,
    error
  } = useQuery({
    queryKey: [GAME_DATA_KEY, accountId],
    queryFn: async () => {
      if (!accountId) {
        const cached = localStorage.getItem('gameData');
        return cached ? JSON.parse(cached) : initialGameData;
      }
      return await loadGameDataFromServer(accountId);
    },
    initialData: (() => {
      const cached = localStorage.getItem('gameData');
      return cached ? JSON.parse(cached) : initialGameData;
    })(),
    enabled: !!accountId,
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
  });

  // Оптимистичные обновления
  const {
    data: optimisticData,
    isOptimistic,
    optimisticUpdate,
    updateData
  } = useOptimisticUpdates(gameData);

  // Мутация для обновления данных с версионированием
  const updateMutation = useMutation({
    mutationFn: async ({ updates, recordId, currentVersion }: { 
      updates: Partial<GameData>, 
      recordId?: string,
      currentVersion?: number 
    }) => {
      if (!accountId) throw new Error('No wallet connected');
      
      // Если передан recordId и версия, используем версионированное обновление
      if (recordId && currentVersion !== undefined) {
        return await updateWithVersionCheck('game_data', recordId, updates, currentVersion);
      }
      
      // Иначе обычное обновление
      return await updateGameDataOnServer(accountId, updates);
    },
    onSuccess: (updatedData) => {
      // Обновляем кэш React Query
      queryClient.setQueryData([GAME_DATA_KEY, accountId], updatedData);
      updateData(updatedData);
      
      // Синхронизируем с localStorage
      localStorage.setItem('gameData', JSON.stringify(updatedData));
    },
    onError: (error) => {
      console.error('Failed to update game data:', error);
      toast({
        title: "Ошибка обновления",
        description: "Не удалось сохранить изменения. Попробуйте еще раз.",
        variant: "destructive"
      });
    }
  });

  // Убираем batch update manager - используем прямые обновления
  // useMemo(() => {
  //   batchUpdateManager.setBatchUpdateHandler(async (updates: Partial<GameData>) => {
  //     const operation = () => updateMutation.mutateAsync({ updates });
  //     await retryOperation(operation, { maxRetries: 2 });
  //   });
  // }, [updateMutation, retryOperation]);

  // Real-time синхронизация
  const { forceSync } = useRealTimeSync({
    onGameDataChange: (payload) => {
      if (payload.eventType === 'UPDATE' && payload.new) {
        const newData = transformServerData(payload.new);
        queryClient.setQueryData([GAME_DATA_KEY, accountId], newData);
        updateData(newData);
      }
    },
    onMarketplaceChange: () => {
      // Инвалидируем кэш маркетплейса
      queryClient.invalidateQueries({ queryKey: ['marketplace'] });
    },
    onShopInventoryChange: () => {
      // Инвалидируем кэш магазина
      queryClient.invalidateQueries({ queryKey: ['shopInventory'] });
    },
    onCardInstanceChange: () => {
      // Инвалидируем кэш экземпляров карт
      queryClient.invalidateQueries({ queryKey: ['cardInstances'] });
    }
  });

  // Действия для обновления состояния
  const actions = useMemo(() => ({
    updateBalance: async (balance: number) => {
      const operation = withErrorHandling(async () => {
        await optimisticUpdate(
          { ...optimisticData, balance },
          async () => {
            const result = await updateMutation.mutateAsync({ updates: { balance } });
            return result;
          }
        );
      });
      await operation();
    },

    updateInventory: async (inventory: any[]) => {
      const operation = withErrorHandling(async () => {
        await optimisticUpdate(
          { ...optimisticData, inventory },
          async () => {
            const result = await updateMutation.mutateAsync({ updates: { inventory } });
            return result;
          }
        );
      });
      await operation();
    },

    updateCards: async (cards: any[]) => {
      const operation = withErrorHandling(async () => {
        await optimisticUpdate(
          { ...optimisticData, cards },
          async () => {
            const result = await updateMutation.mutateAsync({ updates: { cards } });
            return result;
          }
        );
      });
      await operation();
    },

    batchUpdate: async (updates: Partial<GameData>) => {
      const operation = withErrorHandling(async () => {
        // Вычисляем новые оптимистичные данные
        const newOptimisticData = { ...optimisticData, ...updates };
        
        await optimisticUpdate(
          newOptimisticData,
          async () => {
            const result = await updateMutation.mutateAsync({ updates });
            return result;
          }
        );
      });
      await operation();
    },

    optimisticUpdate: async <T>(key: keyof GameData, value: T, serverAction: () => Promise<GameData>) => {
      const operation = withErrorHandling(async () => {
        const newData = { ...optimisticData, [key]: value } as GameData;
        await optimisticUpdate(newData, serverAction);
      });
      await operation();
    }
  }), [optimisticData, optimisticUpdate, updateMutation, withErrorHandling]);

  return {
    ...optimisticData,
    loading: isLoading || updateMutation.isPending,
    error: error?.message || null,
    actions
  } as UnifiedGameState;
};

// Вспомогательные функции для работы с сервером
async function loadGameDataFromServer(walletAddress: string): Promise<GameData> {
  const { data, error } = await supabase
    .from('game_data')
    .select('*')
    .eq('wallet_address', walletAddress)
    .maybeSingle();

  if (error) {
    console.error('Failed to load game data:', error);
    throw error;
  }

  if (!data) {
    // Создаем или обновляем запись для пользователя (без дублей)
    const newData = { 
      ...initialGameData, 
      wallet_address: walletAddress,
      user_id: '00000000-0000-0000-0000-000000000000' // Временный user_id
    };

    const { data: upserted, error: upsertError } = await supabase
      .from('game_data')
      .upsert(newData, { onConflict: 'wallet_address' })
      .select()
      .single();

    if (upsertError) throw upsertError;
    return transformServerData(upserted);
  }

  return transformServerData(data);
}

async function updateGameDataOnServer(walletAddress: string, updates: Partial<GameData>): Promise<GameData> {
  console.log(`🔄 Updating server data for ${walletAddress}:`, updates);
  
  const { data, error } = await supabase
    .from('game_data')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('wallet_address', walletAddress)
    .select()
    .single();

  if (error) {
    console.error('Failed to update game data:', error);
    throw error;
  }

  console.log(`✅ Server updated successfully. New balance: ${data.balance}`);
  return transformServerData(data);
}

function transformServerData(serverData: any): GameData {
  const transformed = {
    balance: serverData.balance ?? 100,
    cards: serverData.cards ?? [],
    initialized: serverData.initialized ?? false,
    inventory: serverData.inventory ?? [],
    dragonEggs: serverData.dragon_eggs ?? [],
    selectedTeam: serverData.selected_team ?? [],
    battleState: serverData.battle_state ?? null,
    marketplaceListings: serverData.marketplace_listings ?? [],
    socialQuests: serverData.social_quests ?? [],
    adventurePlayerStats: serverData.adventure_player_stats ?? null,
    adventureCurrentMonster: serverData.adventure_current_monster ?? null,
    barracksUpgrades: serverData.barracks_upgrades ?? [],
    dragonLairUpgrades: serverData.dragon_lair_upgrades ?? [],
    accountLevel: serverData.account_level ?? 1,
    accountExperience: serverData.account_experience ?? 0
  };
  
  console.log('🔄 Transformed game data:', {
    wallet: serverData.wallet_address,
    balance: transformed.balance,
    inventoryItems: transformed.inventory?.length ?? 0,
    cards: transformed.cards?.length ?? 0
  });
  
  return transformed;
}