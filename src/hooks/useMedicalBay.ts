import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useWalletContext } from '@/contexts/WalletConnectContext';
import { useGameData } from '@/hooks/useGameData';
import { useGameStore } from '@/stores/gameStore';
import { useQueryClient } from '@tanstack/react-query';

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
  const [medicalBayEntries, setMedicalBayEntries] = useState<MedicalBayEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { accountId } = useWalletContext();
  const { gameData, updateGameData } = useGameData();
  const queryClient = useQueryClient();

  const loadMedicalBayEntries = useCallback(async () => {
    if (!accountId) return;

    try {
      setLoading(true);
      console.log('🏥 Loading medical bay entries for:', accountId);
      const { data, error } = await supabase
        .rpc('get_medical_bay_entries', { p_wallet_address: accountId });

      if (error) throw error;
      
      const mapped = (data as any[] | null)?.map((row: any) => ({
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

      // Дедупликация на клиенте по card_instance_id (оставляем самую раннюю запись)
      const uniqueMap = new Map<string, any>();
      for (const entry of mapped) {
        const existing = uniqueMap.get(entry.card_instance_id);
        if (!existing) {
          uniqueMap.set(entry.card_instance_id, entry);
        } else {
          const existingTime = new Date(existing.placed_at).getTime();
          const currentTime = new Date(entry.placed_at).getTime();
          if (currentTime < existingTime) uniqueMap.set(entry.card_instance_id, entry);
        }
      }
      const uniqueEntries = Array.from(uniqueMap.values());

      console.log('🏥 Loaded medical bay entries:', mapped.length, 'entries; unique:', uniqueEntries.length);
      setMedicalBayEntries(uniqueEntries);
    } catch (error) {
      console.error('Error loading medical bay entries:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить данные медпункта",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [accountId, toast]);

  const placeCardInMedicalBay = useCallback(async (cardInstanceIdOrTemplateId: string) => {
    console.log('🏥 [MEDICAL BAY] placeCardInMedicalBay called with:', cardInstanceIdOrTemplateId);
    console.log('🏥 [MEDICAL BAY] accountId:', accountId);
    console.log('🏥 [MEDICAL BAY] gameData.activeWorkers:', gameData?.activeWorkers);
    
    if (!accountId) {
      console.log('🏥 [ERROR] No accountId!');
      return;
    }

    // Проверяем, есть ли назначенные рабочие в медпункт (state или localStorage)
    const getActiveWorkersSafe = () => {
      const fromState = Array.isArray((gameData as any)?.activeWorkers) ? (gameData as any).activeWorkers : [];
      if (fromState.length > 0) return fromState;
      try {
        const cached = localStorage.getItem('activeWorkers');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed)) return parsed;
        }
      } catch {}
      return [] as any[];
    };

    const workers = getActiveWorkersSafe();
    // Учитываем длительность задания рабочего
    const now = Date.now();
    const hasWorkersInMedical = workers.some((w: any) => w.building === 'medical' && (w.startTime + w.duration) > now);
    console.log('🏥 [CHECK] hasWorkersInMedical:', hasWorkersInMedical, { workers });
    
    if (!hasWorkersInMedical) {
      console.log('🏥 [WARN] No workers in medical bay — proceeding with timer-based healing');
      toast({
        title: "Лечение начато",
        description: "Рабочие не назначены — лечение будет идти по таймеру.",
      });
      // Продолжаем без возврата
    }

    // Проверяем, есть ли активное подземелье
    const isActiveBattle = localStorage.getItem('activeBattleInProgress') === 'true';
    console.log('🏥 [CHECK] isActiveBattle:', isActiveBattle);
    
    if (isActiveBattle) {
      console.log('🏥 [WARN] Active battle flag detected — proceeding with caution');
      toast({
        title: "Внимание",
        description: "Идёт бой. Лечение будет начато, карта будет исключена из команды.",
      });
      // Продолжаем без возврата
    }

    try {
      setLoading(true);
      console.log('🏥 [MEDICAL BAY] Placing card in medical bay:', cardInstanceIdOrTemplateId);

      // Пытаемся найти экземпляр карты
      let { data: instance, error: instErr } = await supabase
        .from('card_instances')
        .select('id, card_template_id, is_in_medical_bay')
        .eq('id', cardInstanceIdOrTemplateId)
        .maybeSingle();
      
      // Если не найден по ID, ищем по template_id
      if (!instance || instErr) {
        console.log('🏥 Card instance not found by ID, searching by template_id...');
        const { data: instanceByTemplate, error: templateErr } = await supabase
          .from('card_instances')
          .select('id, card_template_id, is_in_medical_bay')
          .eq('card_template_id', cardInstanceIdOrTemplateId)
          .eq('wallet_address', accountId)
          .maybeSingle();
          
        if (templateErr) {
          console.warn('🏥 Error finding instance by template:', templateErr);
        }
        
        instance = instanceByTemplate;
      }
      
      const templateId = instance?.card_template_id as string | undefined;
      const actualInstanceId = instance?.id || cardInstanceIdOrTemplateId;
      
      // Защита от дубликатов: если уже в медпункте — выходим
      if ((instance as any)?.is_in_medical_bay) {
        console.log('🏥 [GUARD] Card already in medical bay, skipping RPC');
        toast({ title: "Уже лечится", description: "Эта карта уже находится в медпункте." });
        setLoading(false);
        return;
      }

      // Доп. проверка: ищем активную запись в БД
      try {
        const { data: existing, error: existingErr } = await supabase
          .from('medical_bay')
          .select('id, is_completed')
          .eq('wallet_address', accountId)
          .eq('card_instance_id', actualInstanceId)
          .eq('is_completed', false)
          .limit(1);

        if (!existingErr && existing && existing.length > 0) {
          console.log('🏥 [GUARD] Active medical bay entry already exists, skipping RPC');
          toast({ title: "Уже лечится", description: "Эта карта уже находится в медпункте." });
          setLoading(false);
          return;
        } else if (existingErr) {
          console.warn('🏥 [WARN] Could not verify existing entry:', existingErr.message);
        }
      } catch (e) {
        console.warn('🏥 [WARN] Error while verifying existing entry:', e);
      }
      
      const { data, error } = await supabase.rpc('add_card_to_medical_bay', {
        p_wallet_address: accountId,
        p_card_instance_id: actualInstanceId
      });

      if (error) throw error;
      console.log('🏥 Card placed successfully, medical bay ID:', data);

      // Удаляем карту из команды (и из стора), если она там была
      if (templateId && gameData.selectedTeam) {
        const updatedTeam = (gameData.selectedTeam as any[])
          .map((pair: any) => {
            if (pair.hero?.id === templateId) return null; // если герой - удаляем всю пару
            if (pair.dragon?.id === templateId) return { ...pair, dragon: undefined }; // если дракон - убираем только дракона
            return pair;
          })
          .filter(Boolean) as any[];
        
        if (updatedTeam.length !== gameData.selectedTeam.length) {
          console.log('🏥 Removing card from team as it was placed in medical bay');
          await updateGameData({ selectedTeam: updatedTeam });
          try {
            const { setSelectedTeam } = useGameStore.getState();
            setSelectedTeam(updatedTeam);
          } catch (e) {
            console.warn('🏥 Could not update local store selectedTeam:', e);
          }
        }
      }

      toast({
        title: "Успешно",
        description: "Карта помещена в медпункт и удалена из команды",
      });

      // Обновляем список записей медпункта
      await loadMedicalBayEntries();
      
      // Инвалидируем кэш cardInstances для обновления UI
      await queryClient.invalidateQueries({ queryKey: ['cardInstances', accountId] });
      
      return data;
    } catch (error: any) {
      console.error('Error placing card in medical bay:', error);
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось поместить карту в медпункт",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [accountId, toast, loadMedicalBayEntries, gameData.selectedTeam, updateGameData, queryClient]);

  const removeCardFromMedicalBay = useCallback(async (cardInstanceId: string) => {
    if (!accountId) return;

    try {
      setLoading(true);
      
      console.log('🏥 [MEDICAL BAY] Removing card from medical bay via RPC v2:', cardInstanceId);

      // Используем RPC функцию с SECURITY DEFINER для обхода RLS
      const { data, error } = await supabase
        .rpc('remove_card_from_medical_bay_v2', {
          p_card_instance_id: cardInstanceId,
          p_wallet_address: accountId
        });

      if (error) {
        console.error('🏥 [MEDICAL BAY] RPC Error:', error);
        throw error;
      }

      const result = data as { success: boolean; current_health: number; was_completed: boolean };
      console.log('🏥 [MEDICAL BAY] Card successfully removed:', result);

      // ✅ Явно инвалидируем кэш cardInstances для немедленного обновления UI
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['cardInstances', accountId] }),
        queryClient.refetchQueries({ queryKey: ['cardInstances', accountId] })
      ]);

      toast({
        title: 'Карта забрана из медпункта',
        description: result.was_completed ? 'Здоровье восстановлено' : 'Лечение отменено',
      });

      // Обновляем список записей медпункта
      await loadMedicalBayEntries();
    } catch (error: any) {
      console.error('Error removing card from medical bay:', error);
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось извлечь карту из медпункта',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [accountId, toast, loadMedicalBayEntries, queryClient]);

  const stopHealingWithoutRecovery = useCallback(async (cardInstanceId: string) => {
    if (!accountId) return;

    try {
      setLoading(true);
      
      console.log('🏥 [MEDICAL BAY] Stopping healing without recovery via RPC v2:', cardInstanceId);
      
      // Используем RPC функцию с SECURITY DEFINER для обхода RLS
      const { data, error } = await supabase.rpc('stop_healing_without_recovery_v2', {
        p_card_instance_id: cardInstanceId,
        p_wallet_address: accountId
      });

      if (error) {
        console.error('🏥 [MEDICAL BAY] RPC Error:', error);
        throw error;
      }

      console.log('🏥 [MEDICAL BAY] Healing stopped successfully:', data);

      toast({
        title: "Лечение остановлено",
        description: "Карта удалена из медпункта без восстановления здоровья",
      });

      // Обновляем список записей медпункта
      await loadMedicalBayEntries();
      
      // Инвалидируем кэш cardInstances
      await queryClient.invalidateQueries({ queryKey: ['cardInstances', accountId] });
    } catch (error: any) {
      console.error('Error stopping healing:', error);
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось остановить лечение",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [accountId, toast, loadMedicalBayEntries, queryClient]);

  const processMedicalBayHealing = useCallback(async () => {
    try {
      console.log('🏥 Processing medical bay healing...');
      const { error } = await supabase.rpc('process_medical_bay_healing');
      if (error) throw error;
      
      console.log('🏥 Medical bay healing processed');
      // Данные обновятся автоматически через Real-time подписки
    } catch (error) {
      console.error('🏥 Error processing medical bay healing:', error);
    }
  }, [loadMedicalBayEntries]);

  // Воскрешение мёртвой карточки (100 ELL, 1 час, 50% здоровья)
  const resurrectCard = useCallback(async (cardInstanceId: string) => {
    if (!accountId) return null;

    try {
      setLoading(true);
      console.log('🏥 [RESURRECTION] Starting resurrection for card:', cardInstanceId);

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

      // Обновляем баланс в gameData
      if (result.new_balance !== undefined) {
        await updateGameData({ balance: result.new_balance });
      }

      // Обновляем данные
      await loadMedicalBayEntries();
      await queryClient.invalidateQueries({ queryKey: ['cardInstances', accountId] });
      await queryClient.invalidateQueries({ queryKey: ['gameData', accountId] });

      return result;
    } catch (error: any) {
      console.error('🏥 [RESURRECTION] Error:', error);
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось начать воскрешение",
        variant: "destructive"
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [accountId, toast, loadMedicalBayEntries, queryClient, updateGameData]);

  // Завершение воскрешения (забрать карточку с 50% здоровья)
  const completeResurrection = useCallback(async (cardInstanceId: string) => {
    if (!accountId) return null;

    try {
      setLoading(true);
      console.log('🏥 [RESURRECTION] Completing resurrection for card:', cardInstanceId);

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

      // Обновляем данные
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['cardInstances', accountId] }),
        queryClient.refetchQueries({ queryKey: ['cardInstances', accountId] })
      ]);
      await loadMedicalBayEntries();

      return result;
    } catch (error: any) {
      console.error('🏥 [RESURRECTION] Error completing:', error);
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось завершить воскрешение",
        variant: "destructive"
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [accountId, toast, loadMedicalBayEntries, queryClient]);

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