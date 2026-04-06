import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useWalletContext } from '@/contexts/WalletConnectContext';
import { useGameData } from '@/hooks/useGameData';
import { useGameStore } from '@/stores/gameStore';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/config/reactQuery';
import { sendTelegramNotification } from '@/utils/telegramNotifications';

interface MedicalBayEntry {
  id: string;
  card_instance_id: string;
  placed_at: string;
  estimated_completion: string;
  heal_rate: number;
  is_completed: boolean;
  card_instances?: {
    id: string;
    current_health: number;
    max_health: number;
    current_defense: number;
    max_defense: number;
    max_power: number;
    max_magic: number;
    card_data: any;
  };
}

export const useMedicalBay = () => {
  const { toast } = useToast();
  const { accountId } = useWalletContext();
  const { gameData, updateGameData } = useGameData();
  const queryClient = useQueryClient();
  // Track which entries already sent a completion notification
  const notifiedCompletionsRef = useRef<Set<string>>(new Set());

  // React Query для данных медпункта
  const { 
    data: medicalBayEntries = [], 
    isLoading: loading,
    refetch 
  } = useQuery({
    queryKey: queryKeys.medicalBay(accountId || ''),
    queryFn: async () => {
      if (!accountId) return [];
      
      console.log('🏥 Loading medical bay entries for:', accountId);
      const { data, error } = await supabase
        .rpc('get_medical_bay_entries', { p_wallet_address: accountId });

      if (error) throw error;
      
      const entries = (data as any[] | null)?.map((row: any) => ({
        id: row.id,
        card_instance_id: row.card_instance_id,
        placed_at: row.placed_at,
        estimated_completion: row.estimated_completion,
        heal_rate: row.heal_rate,
        is_completed: row.is_completed,
        card_instances: {
          id: row.ci_id,
          current_health: row.ci_current_health,
          max_health: row.ci_max_health,
          current_defense: row.ci_current_defense,
          max_defense: row.ci_max_defense,
          max_power: row.ci_max_power,
          max_magic: row.ci_max_magic,
          card_data: row.ci_card_data,
        },
      })) || [];

      console.log('🏥 Loaded medical bay entries:', entries.length);
      return entries as MedicalBayEntry[];
    },
    enabled: !!accountId,
    staleTime: 2 * 60 * 1000, // 2 минуты
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Real-time подписка на medical_bay + notification on completion
  useEffect(() => {
    if (!accountId) return;

    console.log('🏥 [Real-time] Setting up medical_bay subscription for:', accountId);
    
    const channel = supabase
      .channel('medical-bay-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'medical_bay',
          filter: `wallet_address=eq.${accountId}`
        },
        (payload) => {
          console.log('🏥 [Real-time] medical_bay changed:', payload.eventType);

          // Send notification when healing completes (UPDATE with is_completed = true)
          if (payload.eventType === 'UPDATE' && payload.new) {
            const newRow = payload.new as any;
            const oldRow = payload.old as any;
            if (newRow.is_completed && !oldRow?.is_completed) {
              const entryId = newRow.id || newRow.card_instance_id;
              if (!notifiedCompletionsRef.current.has(entryId)) {
                notifiedCompletionsRef.current.add(entryId);
                console.log('📱 Sending healing completion notification for:', entryId);
                sendTelegramNotification(
                  accountId,
                  `💊 Лечение завершено!\nЗдоровье карты полностью восстановлено.`,
                  `medical_complete_${entryId}`
                );
              }
            }
          }

          // Инвалидируем кэш для обновления данных
          queryClient.invalidateQueries({ queryKey: queryKeys.medicalBay(accountId) });
          // Также обновляем cardInstances т.к. is_in_medical_bay меняется
          queryClient.invalidateQueries({ queryKey: ['cardInstances', accountId] });
        }
      )
      .subscribe((status) => {
        console.log('🏥 [Real-time] Subscription status:', status);
      });

    return () => {
      console.log('🏥 [Real-time] Removing medical_bay subscription');
      supabase.removeChannel(channel);
    };
  }, [accountId, queryClient]);

  const loadMedicalBayEntries = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const placeCardInMedicalBay = useCallback(async (cardInstanceIdOrTemplateId: string) => {
    console.log('🏥 [MEDICAL BAY] placeCardInMedicalBay called with:', cardInstanceIdOrTemplateId);
    
    if (!accountId) {
      console.log('🏥 [ERROR] No accountId!');
      return;
    }

    // Проверяем, есть ли назначенные рабочие в медпункт (только из gameData)
    const workers = Array.isArray((gameData as any)?.activeWorkers) ? (gameData as any).activeWorkers : [];
    const now = Date.now();
    const hasWorkersInMedical = workers.some((w: any) => w.building === 'medical' && (w.startTime + w.duration) > now);
    
    if (!hasWorkersInMedical) {
      toast({
        title: "Лечение начато",
        description: "Рабочие не назначены — лечение будет идти по таймеру.",
      });
    }

    // Проверяем, есть ли активное подземелье через Zustand store
    const isActiveBattle = useGameStore.getState().activeBattleInProgress;
    
    if (isActiveBattle) {
      toast({
        title: "Внимание",
        description: "Идёт бой. Лечение будет начато, карта будет исключена из команды.",
      });
    }

    try {
      // Пытаемся найти экземпляр карты
      let { data: instance, error: instErr } = await supabase
        .from('card_instances')
        .select('id, card_template_id, is_in_medical_bay')
        .eq('id', cardInstanceIdOrTemplateId)
        .maybeSingle();
      
      // Если не найден по ID, ищем по template_id
      if (!instance || instErr) {
        const { data: instanceByTemplate } = await supabase
          .from('card_instances')
          .select('id, card_template_id, is_in_medical_bay')
          .eq('card_template_id', cardInstanceIdOrTemplateId)
          .eq('wallet_address', accountId)
          .maybeSingle();
          
        instance = instanceByTemplate;
      }
      
      const templateId = instance?.card_template_id as string | undefined;
      const actualInstanceId = instance?.id || cardInstanceIdOrTemplateId;
      
      // Защита от дубликатов
      if ((instance as any)?.is_in_medical_bay) {
        toast({ title: "Уже лечится", description: "Эта карта уже находится в медпункте." });
        return;
      }

      // Проверка активной записи в БД
      const { data: existing } = await supabase
        .from('medical_bay')
        .select('id')
        .eq('wallet_address', accountId)
        .eq('card_instance_id', actualInstanceId)
        .eq('is_completed', false)
        .limit(1);

      if (existing && existing.length > 0) {
        toast({ title: "Уже лечится", description: "Эта карта уже находится в медпункте." });
        return;
      }
      
      const { data, error } = await supabase.rpc('add_card_to_medical_bay', {
        p_card_instance_id: actualInstanceId,
        p_wallet_address: accountId
      });

      if (error) throw error;

      // Удаляем карту из команды
      if (templateId && gameData.selectedTeam) {
        const updatedTeam = (gameData.selectedTeam as any[])
          .map((pair: any) => {
            if (pair.hero?.id === templateId) return null;
            if (pair.dragon?.id === templateId) return { ...pair, dragon: undefined };
            return pair;
          })
          .filter(Boolean) as any[];
        
        if (updatedTeam.length !== gameData.selectedTeam.length) {
          await updateGameData({ selectedTeam: updatedTeam });
          useGameStore.getState().setSelectedTeam(updatedTeam);
        }
      }

      toast({
        title: "Успешно",
        description: "Карта помещена в медпункт и удалена из команды",
      });

      // Кэш обновится автоматически через Real-time
      return data;
    } catch (error: any) {
      console.error('Error placing card in medical bay:', error);
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось поместить карту в медпункт",
        variant: "destructive"
      });
    }
  }, [accountId, toast, gameData.selectedTeam, updateGameData, gameData]);

  const removeCardFromMedicalBay = useCallback(async (cardInstanceId: string) => {
    if (!accountId) return;

    try {
      const { data, error } = await supabase
        .rpc('remove_card_from_medical_bay_v2', {
          p_card_instance_id: cardInstanceId,
          p_wallet_address: accountId
        });

      if (error) throw error;

      const result = data as { success: boolean; current_health: number; was_completed: boolean };

      toast({
        title: 'Карта забрана из медпункта',
        description: result.was_completed ? 'Здоровье восстановлено' : 'Лечение отменено',
      });

      // Notification is now sent via real-time subscription on is_completed transition

      // Кэш обновится автоматически через Real-time
    } catch (error: any) {
      console.error('Error removing card from medical bay:', error);
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось извлечь карту из медпункта',
        variant: 'destructive'
      });
    }
  }, [accountId, toast]);

  const stopHealingWithoutRecovery = useCallback(async (cardInstanceId: string) => {
    if (!accountId) return;

    try {
      const { error } = await supabase.rpc('stop_healing_without_recovery_v2', {
        p_card_instance_id: cardInstanceId,
        p_wallet_address: accountId
      });

      if (error) throw error;

      toast({
        title: "Лечение остановлено",
        description: "Карта удалена из медпункта без восстановления здоровья",
      });

      // Кэш обновится автоматически через Real-time
    } catch (error: any) {
      console.error('Error stopping healing:', error);
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось остановить лечение",
        variant: "destructive"
      });
    }
  }, [accountId, toast]);

  const processMedicalBayHealing = useCallback(async () => {
    try {
      const { error } = await supabase.rpc('process_medical_bay_healing');
      if (error) throw error;
      // Данные обновятся автоматически через Real-time подписки
    } catch (error) {
      console.error('🏥 Error processing medical bay healing:', error);
    }
  }, []);

  const resurrectCard = useCallback(async (cardInstanceId: string) => {
    if (!accountId) return null;

    try {
      const { data, error } = await supabase.rpc('resurrect_card_in_medical_bay', {
        p_card_instance_id: cardInstanceId,
        p_wallet_address: accountId
      });

      if (error) throw error;

      const result = data as { success: boolean; error?: string; new_balance?: number };
      
      if (!result.success) {
        toast({
          title: "Ошибка воскрешения",
          description: result.error || "Не удалось начать воскрешение",
          variant: "destructive"
        });
        return null;
      }

      toast({
        title: "Воскрешение начато",
        description: "Карточка будет воскрешена через 1 час (стоимость: 100 ELL)",
      });

      if (result.new_balance !== undefined) {
        await updateGameData({ balance: result.new_balance });
      }

      // Кэш обновится автоматически через Real-time
      return result;
    } catch (error: any) {
      console.error('🏥 [RESURRECTION] Error:', error);
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось начать воскрешение",
        variant: "destructive"
      });
      return null;
    }
  }, [accountId, toast, updateGameData]);

  const completeResurrection = useCallback(async (cardInstanceId: string) => {
    if (!accountId) return null;

    try {
      const { data, error } = await supabase.rpc('complete_resurrection', {
        p_card_instance_id: cardInstanceId,
        p_wallet_address: accountId
      });

      if (error) throw error;

      const result = data as { success: boolean; error?: string; new_health?: number; max_health?: number };
      
      if (!result.success) {
        toast({
          title: "Ошибка",
          description: result.error || "Не удалось завершить воскрешение",
          variant: "destructive"
        });
        return null;
      }

      toast({
        title: "Карточка воскрешена!",
        description: `Здоровье восстановлено до ${result.new_health}/${result.max_health} (50%)`,
      });

      // Кэш обновится автоматически через Real-time
      return result;
    } catch (error: any) {
      console.error('🏥 [RESURRECTION] Error completing:', error);
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось завершить воскрешение",
        variant: "destructive"
      });
      return null;
    }
  }, [accountId, toast]);

  return {
    medicalBayEntries,
    loading,
    loadMedicalBayEntries,
    placeCardInMedicalBay,
    removeCardFromMedicalBay,
    stopHealingWithoutRecovery,
    processMedicalBayHealing,
    resurrectCard,
    completeResurrection
  };
};
