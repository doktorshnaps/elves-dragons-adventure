import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useWalletContext } from '@/contexts/WalletConnectContext';
import { useGameData } from '@/hooks/useGameData';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/config/reactQuery';

interface ForgeBayEntry {
  id: string;
  card_instance_id: string;
  placed_at: string;
  estimated_completion: string;
  repair_rate: number;
  is_completed: boolean;
  card_instances?: {
    id: string;
    current_defense: number;
    max_defense: number;
    current_health: number;
    max_health: number;
    max_power: number;
    max_magic: number;
    card_data: any;
  };
}

export const useForgeBay = () => {
  const { toast } = useToast();
  const { accountId } = useWalletContext();
  const { gameData } = useGameData();
  const queryClient = useQueryClient();

  // React Query для данных кузницы
  const { 
    data: forgeBayEntries = [], 
    isLoading: loading,
    refetch 
  } = useQuery({
    queryKey: queryKeys.forgeBay(accountId || ''),
    queryFn: async () => {
      if (!accountId) return [];
      
      console.log('⚒️ Loading forge bay entries for:', accountId);
      const { data, error } = await supabase
        .rpc('get_forge_bay_entries', { p_wallet_address: accountId });

      if (error) throw error;
      
      const entries = (data as any[] | null)?.map((row: any) => ({
        id: row.id,
        card_instance_id: row.card_instance_id,
        placed_at: row.placed_at,
        estimated_completion: row.estimated_completion,
        repair_rate: row.repair_rate,
        is_completed: row.is_completed,
        card_instances: {
          id: row.ci_id,
          current_defense: row.ci_current_defense,
          max_defense: row.ci_max_defense,
          current_health: row.ci_current_health,
          max_health: row.ci_max_health,
          max_power: row.ci_max_power,
          max_magic: row.ci_max_magic,
          card_data: row.ci_card_data,
        },
      })) || [];

      console.log('⚒️ Loaded forge bay entries:', entries.length);
      return entries as ForgeBayEntry[];
    },
    enabled: !!accountId,
    staleTime: 2 * 60 * 1000, // 2 минуты
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Real-time подписка на forge_bay
  useEffect(() => {
    if (!accountId) return;

    console.log('⚒️ [Real-time] Setting up forge_bay subscription for:', accountId);
    
    const channel = supabase
      .channel('forge-bay-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'forge_bay',
          filter: `wallet_address=eq.${accountId}`
        },
        (payload) => {
          console.log('⚒️ [Real-time] forge_bay changed:', payload.eventType);
          // Инвалидируем кэш для обновления данных
          queryClient.invalidateQueries({ queryKey: queryKeys.forgeBay(accountId) });
          // Также обновляем cardInstances т.к. статус карты меняется
          queryClient.invalidateQueries({ queryKey: ['cardInstances', accountId] });
        }
      )
      .subscribe((status) => {
        console.log('⚒️ [Real-time] Subscription status:', status);
      });

    return () => {
      console.log('⚒️ [Real-time] Removing forge_bay subscription');
      supabase.removeChannel(channel);
    };
  }, [accountId, queryClient]);

  const loadForgeBayEntries = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const placeCardInForgeBay = useCallback(async (cardInstanceIdOrTemplateId: string) => {
    console.log('⚒️ [FORGE BAY] placeCardInForgeBay called with:', cardInstanceIdOrTemplateId);
    
    if (!accountId) {
      console.log('⚒️ [ERROR] No accountId!');
      return;
    }

    // Проверяем рабочих только из gameData (без localStorage)
    const activeWorkers = Array.isArray((gameData as any)?.activeWorkers) 
      ? (gameData as any).activeWorkers 
      : [];
    
    const hasForgeWorkers = activeWorkers.some((worker: any) => worker.building === 'forge');

    if (!hasForgeWorkers) {
      toast({
        title: "Нет рабочих",
        description: "Назначьте рабочих в кузницу перед началом ремонта",
        variant: "destructive"
      });
      return;
    }

    // Проверяем состояние боя
    const battleState = (gameData as any)?.battle_state;
    if (battleState && battleState.inBattle) {
      toast({
        title: "Нельзя начать ремонт",
        description: "Завершите бой перед началом ремонта",
        variant: "destructive"
      });
      return;
    }

    try {
      // Используем RPC для получения карт (обход RLS)
      const { data: allInstances, error: rpcError } = await supabase
        .rpc('get_card_instances_by_wallet', { 
          p_wallet_address: accountId 
        });
      
      if (rpcError) throw rpcError;
      
      const instance = (allInstances as any[])?.find(
        (ci: any) => ci.id === cardInstanceIdOrTemplateId || ci.card_template_id === cardInstanceIdOrTemplateId
      );

      // Защита от дубликатов
      if (instance?.is_in_medical_bay) {
        toast({ 
          title: "Уже ремонтируется", 
          description: "Эта карта уже находится в кузнице или медпункте." 
        });
        return;
      }

      if (!instance) {
        toast({
          title: "Карта не найдена",
          description: "Не удалось найти экземпляр карты",
          variant: "destructive"
        });
        return;
      }

      // Проверяем необходимость ремонта
      if (instance.current_defense >= instance.max_defense) {
        toast({
          title: "Броня в порядке",
          description: "Эта карта не нуждается в ремонте",
          variant: "destructive"
        });
        return;
      }

      const cardInstanceId = instance.id;

      // Удаляем карту из команды
      const { data: currentData, error: fetchError } = await supabase
        .from('game_data')
        .select('selected_team')
        .eq('wallet_address', accountId)
        .single();

      if (!fetchError && currentData) {
        const team = Array.isArray(currentData.selected_team) ? currentData.selected_team : [];
        const updatedTeam = team.map((pair: any) => ({
          hero: pair.hero?.id === cardInstanceIdOrTemplateId ? null : pair.hero,
          dragon: pair.dragon?.id === cardInstanceIdOrTemplateId ? null : pair.dragon,
        }));

        await supabase
          .from('game_data')
          .update({ selected_team: updatedTeam })
          .eq('wallet_address', accountId);
      }

      // Добавляем карту в кузницу
      const { data: entryId, error: addError } = await supabase
        .rpc('add_card_to_forge_bay', {
          p_card_instance_id: cardInstanceId,
          p_wallet_address: accountId
        });
      
      if (addError) throw addError;
      
      toast({
        title: "Карта отправлена в кузницу",
        description: "Ремонт брони начался",
      });

      // Кэш обновится автоматически через Real-time
      return entryId;
    } catch (error: any) {
      console.error('⚒️ Error placing card in forge bay:', error);
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось отправить карту в кузницу",
        variant: "destructive"
      });
    }
  }, [accountId, gameData, toast]);

  const removeCardFromForgeBay = useCallback(async (cardInstanceId: string) => {
    if (!accountId) return;

    try {
      const { data, error } = await supabase
        .rpc('remove_card_from_forge_bay_v2', {
          p_card_instance_id: cardInstanceId,
          p_wallet_address: accountId
        });

      if (error) throw error;

      const result = data as { success: boolean; current_defense: number; was_completed: boolean };

      toast({
        title: "Карта забрана из кузницы",
        description: result.was_completed ? "Броня восстановлена" : "Ремонт отменен",
      });

      // Кэш обновится автоматически через Real-time
    } catch (error: any) {
      console.error('Error removing card from forge bay:', error);
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось забрать карту из кузницы",
        variant: "destructive"
      });
    }
  }, [accountId, toast]);

  const stopRepairWithoutRecovery = useCallback(async (cardInstanceId: string) => {
    if (!accountId) return;

    try {
      const { error } = await supabase
        .rpc('stop_repair_without_recovery_v2', {
          p_card_instance_id: cardInstanceId,
          p_wallet_address: accountId
        });

      if (error) throw error;

      toast({
        title: "Ремонт остановлен",
        description: "Карта удалена из кузницы без восстановления брони",
      });

      // Кэш обновится автоматически через Real-time
    } catch (error: any) {
      console.error('Error stopping repair:', error);
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось остановить ремонт",
        variant: "destructive"
      });
    }
  }, [accountId, toast]);

  const processForgeBayRepair = useCallback(async () => {
    try {
      const { error } = await supabase.rpc('process_forge_bay_repair');
      if (error) throw error;
      // Данные обновятся автоматически через Real-time подписки
    } catch (error) {
      console.error('Error processing forge bay repair:', error);
    }
  }, []);

  return {
    forgeBayEntries,
    loading,
    loadForgeBayEntries,
    placeCardInForgeBay,
    removeCardFromForgeBay,
    stopRepairWithoutRecovery,
    processForgeBayRepair
  };
};
