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
  wood: 150,
  stone: 200,
  iron: 75,
  gold: 300,
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
  accountExperience: 0,
  activeWorkers: []
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
    initialData: initialGameData,
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
      console.log('✅ Data updated successfully:', { balance: updatedData.balance });
      // Обновляем кэш React Query
      queryClient.setQueryData([GAME_DATA_KEY, accountId], updatedData);
      updateData(updatedData);
      
      // Убираем localStorage sync - полагаемся только на Supabase
      // localStorage.setItem('gameData', JSON.stringify(updatedData));
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

  // Real-time синхронизация (отключена для card_instances)
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
    // onCardInstanceChange: () => {
    //   // ОТКЛЮЧЕНО - инвалидация кэша экземпляров карт
    //   // Это может вызывать бесконечные перезагрузки
    //   console.log('CardInstance change detected, but invalidation disabled');
    // }
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

    updateResources: async (resources: { wood?: number; stone?: number; iron?: number; gold?: number }) => {
      const operation = withErrorHandling(async () => {
        const newOptimisticData = { ...optimisticData, ...resources };
        await optimisticUpdate(
          newOptimisticData,
          async () => {
            const result = await updateMutation.mutateAsync({ updates: resources });
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

  // Принудительно обновляем данные при изменении accountId
  useMemo(() => {
    if (accountId) {
      queryClient.invalidateQueries({ queryKey: [GAME_DATA_KEY, accountId] });
    }
  }, [accountId, queryClient]);

  return {
    ...optimisticData,
    loading: isLoading || updateMutation.isPending,
    error: error?.message || null,
    actions
  } as UnifiedGameState;
};

// Вспомогательные функции для работы с сервером
function mapClientToServer(data: Partial<GameData> | GameData) {
  const d: any = data;
  const out: any = {};
  if (d.balance !== undefined) out.balance = d.balance;
  if (d.wood !== undefined) out.wood = d.wood;
  if (d.stone !== undefined) out.stone = d.stone;
  if (d.iron !== undefined) out.iron = d.iron;
  if (d.gold !== undefined) out.gold = d.gold;
  if (d.cards !== undefined) out.cards = d.cards;
  if (d.initialized !== undefined) out.initialized = d.initialized;
  if (d.inventory !== undefined) out.inventory = d.inventory;
  if (d.marketplaceListings !== undefined) out.marketplace_listings = d.marketplaceListings;
  if (d.socialQuests !== undefined) out.social_quests = d.socialQuests;
  if (d.adventurePlayerStats !== undefined) out.adventure_player_stats = d.adventurePlayerStats;
  if (d.adventureCurrentMonster !== undefined) out.adventure_current_monster = d.adventureCurrentMonster;
  if (d.dragonEggs !== undefined) out.dragon_eggs = d.dragonEggs;
  if (d.battleState !== undefined) out.battle_state = d.battleState;
  if (d.selectedTeam !== undefined) out.selected_team = d.selectedTeam;
  if (d.barracksUpgrades !== undefined) out.barracks_upgrades = d.barracksUpgrades;
  if (d.dragonLairUpgrades !== undefined) out.dragon_lair_upgrades = d.dragonLairUpgrades;
  if (d.accountLevel !== undefined) out.account_level = d.accountLevel;
  if (d.accountExperience !== undefined) out.account_experience = d.accountExperience;
  if (d.activeWorkers !== undefined) out.active_workers = d.activeWorkers;
  return out;
}

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
    console.log('📋 No existing data found, creating new record for:', walletAddress);
    // Создаем или обновляем запись для пользователя (без дублей)
    const newData = {
      ...mapClientToServer(initialGameData),
      wallet_address: walletAddress,
      user_id: '00000000-0000-0000-0000-000000000000'
    } as any;

    const { data: inserted, error: insertError } = await supabase
      .from('game_data')
      .insert(newData)
      .select()
      .single();

    if (insertError) {
      console.error('Failed to insert game data:', insertError);
      throw insertError;
    }
    console.log('✅ Created new game data with balance:', inserted.balance);
    return transformServerData(inserted);
  }

  console.log('📂 Loaded existing game data with balance:', data.balance);
  return transformServerData(data);
}

async function updateGameDataOnServer(walletAddress: string, updates: Partial<GameData>): Promise<GameData> {
  console.log(`🔄 Updating server data for ${walletAddress}:`, updates);
  
  const serverUpdates = {
    ...mapClientToServer(updates),
    updated_at: new Date().toISOString()
  } as any;

  // Пытаемся обновить существующую запись
  const { data, error } = await supabase
    .from('game_data')
    .update(serverUpdates)
    .eq('wallet_address', walletAddress)
    .select()
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    console.error('Failed to update game data:', error);
    throw error;
  }

  // Если записи не было, создаём её через upsert
  if (!data) {
    const { data: inserted, error: insertError } = await supabase
      .from('game_data')
      .insert({ ...serverUpdates, wallet_address: walletAddress })
      .select()
      .single();

    if (insertError) {
      console.error('Failed to insert game data:', insertError);
      throw insertError;
    }

    console.log(`✅ Server inserted successfully. New balance: ${inserted.balance}`);
    return transformServerData(inserted);
  }

  console.log(`✅ Server updated successfully. New balance: ${data.balance}`);
  return transformServerData(data);
}

function transformServerData(serverData: any): GameData {
  const transformed = {
    balance: serverData.balance ?? 100,
    wood: serverData.wood ?? 150,
    stone: serverData.stone ?? 200,
    iron: serverData.iron ?? 75,
    gold: serverData.gold ?? 300,
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
    accountExperience: serverData.account_experience ?? 0,
    activeWorkers: serverData.active_workers ?? []
  };
  
  console.log('🔄 Transformed game data:', {
    wallet: serverData.wallet_address,
    balance: transformed.balance,
    inventoryItems: transformed.inventory?.length ?? 0,
    cards: transformed.cards?.length ?? 0,
    activeWorkers: transformed.activeWorkers?.length ?? 0
  });
  
  return transformed;
}