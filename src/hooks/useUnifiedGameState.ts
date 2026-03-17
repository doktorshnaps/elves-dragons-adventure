import React from 'react'; // Added React import
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useCallback, useMemo, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useWalletContext } from '@/contexts/WalletConnectContext';
import { useOptimisticUpdates } from './useOptimisticUpdates';
import { useRealTimeSync } from './useRealTimeSync';
import { useVersioning } from './useVersioning';
import { useErrorHandling } from './useErrorHandling';
import { batchUpdateManager } from '@/utils/batchUpdates';
import { GameData, UnifiedGameState } from '@/types/gameState';
import { useToast } from './use-toast';
import { gameCache } from '@/utils/cacheStrategy';
import { updateGameDataByWalletThrottled } from '@/utils/updateGameDataThrottle';
import { useGameDataContext } from '@/contexts/GameDataContext';

const GAME_DATA_KEY = 'gameData';
const STALE_TIME = 10 * 60 * 1000; // 10 минут - увеличено для снижения повторных запросов
const CACHE_TIME = 30 * 60 * 1000; // 30 минут

const ensuredWallets = new Set<string>();
const ensureOnce = async (wallet: string) => {
  if (ensuredWallets.has(wallet)) return;
  try {
    await supabase.rpc('ensure_game_data_exists', { p_wallet_address: wallet });
  } catch (e) {
    console.warn('ensure_game_data_exists failed (may already exist):', e);
  } finally {
    ensuredWallets.add(wallet);
  }
};


const initialGameData: GameData = {
  balance: 0,
  wood: 0,
  stone: 0,
  cards: [],
  initialized: false,
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
  activeWorkers: [],
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

export const useUnifiedGameState = (): UnifiedGameState => {
  const { accountId } = useWalletContext();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { updateWithVersionCheck, getRecordVersion } = useVersioning();
  const { withErrorHandling, retryOperation } = useErrorHandling();

  // КРИТИЧНО: Используем GameDataContext вместо прямого запроса
  // Это предотвращает дублирование запросов get_game_data_by_wallet_full
  const gameDataContext = useGameDataContext();
  
  const gameData = gameDataContext.gameData || initialGameData;
  const isLoading = gameDataContext.loading;
  const error = null; // Error handling through context

  // Оптимистичные обновления
  const {
    data: optimisticData,
    isOptimistic,
    optimisticUpdate,
    updateData
  } = useOptimisticUpdates(gameData);

  // Sync optimistic data with server data when query returns new values
  useEffect(() => {
    updateData(gameData);
  }, [gameData, updateData]);

  // Мутация для обновления данных с версионированием
  const updateMutation = useMutation({
    mutationFn: async ({ updates, recordId, currentVersion }: { 
      updates: Partial<GameData>, 
      recordId?: string,
      currentVersion?: number 
    }) => {
      if (!accountId) throw new Error('No wallet connected');
      
      // Используем updateGameData из контекста
      await gameDataContext.updateGameData(updates);
      
      // Возвращаем обновленные данные
      return { ...gameDataContext.gameData, ...updates };
    },
    onSuccess: (updatedData) => {
      console.log('✅ Data updated successfully:', { 
        balance: updatedData.balance, 
        activeWorkers: updatedData.activeWorkers?.length ?? 0 
      });
      // Обновляем кэш React Query
      queryClient.setQueryData([GAME_DATA_KEY, accountId], updatedData);
      updateData(updatedData);
      
      // OPTIMIZATION: Removed localStorage sync - data only in React Query and Supabase
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

  // Real-time синхронизация (только marketplace - остальные подписки в своих провайдерах)
  const { forceSync } = useRealTimeSync({
    onMarketplaceChange: () => {
      // Инвалидируем кэш маркетплейса
      queryClient.invalidateQueries({ queryKey: ['marketplace'] });
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

    updateResources: async (resources: { wood?: number; stone?: number }) => {
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

  // Текущее состояние: показываем серверные данные, если нет активного оптимистичного апдейта
  const currentData = isOptimistic ? (optimisticData as GameData) : (gameData as GameData);

  return {
    ...currentData,
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
  if (d.cards !== undefined) out.cards = d.cards;
  if (d.initialized !== undefined) out.initialized = d.initialized;
  // inventory removed (legacy field, use item_instances table)
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
  if (d.buildingLevels !== undefined) out.building_levels = d.buildingLevels;
  if (d.activeBuildingUpgrades !== undefined) out.active_building_upgrades = d.activeBuildingUpgrades;
  // Production data
  if (d.woodLastCollectionTime !== undefined) out.wood_last_collection_time = d.woodLastCollectionTime;
  if (d.stoneLastCollectionTime !== undefined) out.stone_last_collection_time = d.stoneLastCollectionTime;
  if (d.woodProductionData !== undefined) out.wood_production_data = d.woodProductionData;
  if (d.stoneProductionData !== undefined) out.stone_production_data = d.stoneProductionData;
  return out;
}

async function loadGameDataFromServer(walletAddress: string): Promise<GameData> {
  // 1) Пытаемся получить ПОЛНУЮ запись через SECURITY DEFINER RPC (включая active_workers)
  const { data: fullData, error: fullErr } = await supabase.rpc('get_game_data_by_wallet_full', {
    p_wallet_address: walletAddress
  });

  if (!fullErr && fullData) {
    const record = Array.isArray(fullData) ? (fullData as any[])[0] : (fullData as any);
    console.log('📂 Loaded game data via RPC full. Balance:', (record as any).balance);
    return transformServerData(record);
  }

  // 2) Если RPC недоступна, пробуем обычный SELECT (при наличии auth)
  const { data, error } = await supabase
    .from('game_data')
    .select('*')
    .eq('wallet_address', walletAddress)
    .maybeSingle();

  if (error) {
    console.warn('Primary load (select) failed, falling back to initialize RPC:', error.message);
  }

  if (data) {
    console.log('📂 Loaded existing game data with balance (select):', data.balance);
    return transformServerData(data);
  }

  // 3) В крайнем случае инициализируем запись и/или возвращаем initial
  const { data: rpcData, error: rpcError } = await supabase.rpc('initialize_game_data_by_wallet', {
    p_wallet_address: walletAddress
  });

  if (rpcError) {
    console.error('Both select and RPC initialize failed to load game data:', rpcError);
    // Последний шанс — берем из localStorage
    const cached = localStorage.getItem('gameData');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        console.warn('Using cached gameData due to load failure');
        return transformServerData(parsed);
      } catch {}
    }
    throw rpcError;
  }

  if (!rpcData) {
    console.log('RPC returned no data, using initial game data');
    return initialGameData;
  }

  const rec = Array.isArray(rpcData) ? rpcData[0] : rpcData;
  console.log('📂 Loaded existing game data via initialize RPC, balance:', rec.balance);
  return transformServerData(rec);
}

async function updateGameDataOnServer(walletAddress: string, updates: Partial<GameData>): Promise<GameData> {
  console.log(`🔄 Updating server data for ${walletAddress}:`, updates);
  
  // Специальная обработка activeWorkers: обновляем через SECURITY DEFINER RPC, чтобы обойти RLS
  if (updates.activeWorkers !== undefined) {
    // Обновляем через SECURITY DEFINER RPC без ensure (избегаем 409 при гонках)
    const { data: ok, error: rpcErr } = await supabase.rpc('update_active_workers_by_wallet', {
      p_wallet_address: walletAddress,
      p_active_workers: updates.activeWorkers as any
    });

    if (rpcErr) {
      console.error('RPC update_active_workers_by_wallet failed:', rpcErr);
      throw rpcErr;
    }

    // Загружаем актуальные данные через SECURITY DEFINER RPC
    const { data: fullData, error: fullErr } = await supabase.rpc('get_game_data_by_wallet_full', {
      p_wallet_address: walletAddress
    });

    if (fullErr || !fullData) {
      throw fullErr || new Error('Failed to fetch updated game data');
    }

    const record = Array.isArray(fullData) ? (fullData as any[])[0] : (fullData as any);
    console.log('✅ Active workers updated via RPC.');
    return transformServerData(record);
  }
  
  const serverUpdates = {
    ...mapClientToServer(updates),
    updated_at: new Date().toISOString()
  } as any;

  // Всегда обновляем через SECURITY DEFINER RPC, чтобы обойти RLS и гарантировать сохранение
  const rpcPayload: any = {
    p_wallet_address: walletAddress,
    p_balance: updates.balance,
    p_cards: updates.cards as any,
    // p_inventory removed (legacy field, use item_instances table)
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
    p_dragon_lair_upgrades: updates.dragonLairUpgrades as any,
    p_active_workers: updates.activeWorkers as any,
    p_building_levels: updates.buildingLevels as any,
    p_active_building_upgrades: updates.activeBuildingUpgrades as any,
    p_wood: updates.wood,
    p_stone: updates.stone,
    p_wood_last_collection_time: updates.woodLastCollectionTime,
    p_stone_last_collection_time: updates.stoneLastCollectionTime,
    p_wood_production_data: updates.woodProductionData as any,
    p_stone_production_data: updates.stoneProductionData as any
  };

  const ok = await updateGameDataByWalletThrottled(rpcPayload);
  if (!ok) {
    console.warn('⚠️ RPC returned false, continue to refetch for consistency');
  }

  const { data: fullData, error: fullErr } = await supabase.rpc('get_game_data_by_wallet_full', {
    p_wallet_address: walletAddress
  });

  if (fullErr || !fullData) {
    throw fullErr || new Error('Failed to fetch updated game data');
  }

  const record = Array.isArray(fullData) ? (fullData as any[])[0] : (fullData as any);
  console.log('✅ Server updated via RPC. New balance:', record.balance);
  return transformServerData(record);
}

function transformServerData(serverData: any): GameData {
  const transformed = {
    balance: serverData.balance ?? 0,
    wood: serverData.wood ?? 0,
    stone: serverData.stone ?? 0,
    iron: serverData.iron ?? 0,
    gold: serverData.gold ?? 0,
    cards: serverData.cards ?? [],
    initialized: serverData.initialized ?? false,
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
    activeWorkers: serverData.active_workers ?? [],
    buildingLevels: serverData.building_levels ?? {
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
    activeBuildingUpgrades: serverData.active_building_upgrades ?? [],
    // Production data from DB
    woodLastCollectionTime: serverData.wood_last_collection_time,
    stoneLastCollectionTime: serverData.stone_last_collection_time,
    woodProductionData: serverData.wood_production_data ?? { isProducing: true, isStorageFull: false },
    stoneProductionData: serverData.stone_production_data ?? { isProducing: true, isStorageFull: false }
  };
  
  console.log('🔄 Transformed game data:', {
    wallet: serverData.wallet_address,
    balance: transformed.balance,
    cards: transformed.cards?.length ?? 0,
    activeWorkers: transformed.activeWorkers?.length ?? 0,
    activeWorkersData: transformed.activeWorkers,
    woodLastCollection: transformed.woodLastCollectionTime,
    stoneLastCollection: transformed.stoneLastCollectionTime
  });
  
  return transformed;
}