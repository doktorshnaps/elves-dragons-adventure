import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useWalletContext } from '@/contexts/WalletConnectContext';
import { useGameData } from '@/hooks/useGameData';

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
    card_data: any;
  };
}

export const useForgeBay = () => {
  const [forgeBayEntries, setForgeBayEntries] = useState<ForgeBayEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { accountId } = useWalletContext();
  const { gameData } = useGameData();

  const loadForgeBayEntries = useCallback(async () => {
    if (!accountId) return;

    try {
      setLoading(true);
      console.log('⚒️ Loading forge bay entries for:', accountId);
      const { data, error } = await supabase
        .rpc('get_forge_bay_entries', { p_wallet_address: accountId });

      if (error) throw error;
      
      const mapped = (data as any[] | null)?.map((row: any) => ({
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
          card_data: row.ci_card_data,
        },
      })) || [];

      // Дедупликация на клиенте по card_instance_id
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

      console.log('⚒️ Loaded forge bay entries:', mapped.length, 'entries; unique:', uniqueEntries.length);
      setForgeBayEntries(uniqueEntries);
    } catch (error) {
      console.error('Error loading forge bay entries:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить данные кузницы",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [accountId, toast]);

  const placeCardInForgeBay = useCallback(async (cardInstanceIdOrTemplateId: string) => {
    console.log('⚒️ [FORGE BAY] placeCardInForgeBay called with:', cardInstanceIdOrTemplateId);
    
    if (!accountId) {
      console.log('⚒️ [ERROR] No accountId!');
      return;
    }

    // Проверяем, есть ли назначенные рабочие в кузницу
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

    // Проверяем, есть ли назначенные рабочие в кузницу
    const activeWorkers = getActiveWorkersSafe();
    console.log('⚒️ [FORGE BAY] activeWorkers:', activeWorkers);
    
    const hasForgeWorkers = activeWorkers.some((worker: any) => worker.building === 'forge');
    console.log('⚒️ [FORGE BAY] hasForgeWorkers:', hasForgeWorkers);

    if (!hasForgeWorkers) {
      toast({
        title: "Нет рабочих",
        description: "Назначьте рабочих в кузницу перед началом ремонта",
        variant: "destructive"
      });
      return;
    }

    // Проверяем, не в бою ли игрок
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
      setLoading(true);
      
      console.log('⚒️ [FORGE] Searching for card:', cardInstanceIdOrTemplateId);
      console.log('⚒️ [FORGE] accountId (wallet):', accountId);
      
      // КРИТИЧНО: Используем RPC get_card_instances_by_wallet вместо прямого запроса
      // т.к. auth.uid() = NULL и RLS блокирует прямые запросы
      const { data: allInstances, error: rpcError } = await supabase
        .rpc('get_card_instances_by_wallet', { 
          p_wallet_address: accountId 
        });
      
      if (rpcError) {
        console.error('⚒️ [FORGE] RPC error:', rpcError);
        throw rpcError;
      }
      
      // Ищем нужную карту среди всех инстансов
      const instance = (allInstances as any[])?.find(
        (ci: any) => ci.id === cardInstanceIdOrTemplateId || ci.card_template_id === cardInstanceIdOrTemplateId
      );

      console.log('⚒️ [FORGE] Found instance via RPC:', { 
        instance,
        totalInstances: allInstances?.length
      });

      // Защита от дубликатов: если уже в кузнице — выходим
      if (instance?.is_in_medical_bay) {
        console.log('⚒️ [GUARD] Card already in forge bay, skipping RPC');
        toast({ 
          title: "Уже ремонтируется", 
          description: "Эта карта уже находится в кузнице или медпункте." 
        });
        return;
      }

      if (!instance) {
        console.error('⚒️ Card instance not found:', cardInstanceIdOrTemplateId);
        toast({
          title: "Карта не найдена",
          description: "Не удалось найти экземпляр карты",
          variant: "destructive"
        });
        return;
      }

      // Проверяем, есть ли необходимость в ремонте
      if (instance.current_defense >= instance.max_defense) {
        toast({
          title: "Броня в порядке",
          description: "Эта карта не нуждается в ремонте",
          variant: "destructive"
        });
        return;
      }

      const cardInstanceId = instance.id;


      // Удаляем карту из команды перед началом ремонта
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
      console.log('⚒️ [FORGE] Adding card to forge bay via RPC...');
      console.log('⚒️ [FORGE] RPC params:', {
        p_card_instance_id: cardInstanceId,
        p_repair_hours: 24,
        p_wallet_address: accountId
      });
      
      const { data: entryId, error: addError } = await supabase
        .rpc('add_card_to_forge_bay', {
          p_card_instance_id: cardInstanceId,
          p_repair_hours: 24,
          p_wallet_address: accountId
        });

      console.log('⚒️ [FORGE] RPC result:', { entryId, addError });
      
      if (addError) {
        console.error('⚒️ [FORGE] RPC Error:', addError);
        throw addError;
      }

      console.log('⚒️ Card added to forge bay:', entryId);
      
      toast({
        title: "Карта отправлена в кузницу",
        description: "Ремонт брони начался",
      });

      await loadForgeBayEntries();
    } catch (error: any) {
      console.error('⚒️ Error placing card in forge bay:', error);
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось отправить карту в кузницу",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [accountId, gameData, toast, loadForgeBayEntries]);

  const removeCardFromForgeBay = useCallback(async (cardInstanceId: string) => {
    if (!accountId) return;

    try {
      setLoading(true);
      
      console.log('⚒️ [FORGE] Removing card from forge via RPC v2:', cardInstanceId);

      // Используем RPC функцию с SECURITY DEFINER для обхода RLS
      const { data, error } = await supabase
        .rpc('remove_card_from_forge_bay_v2', {
          p_card_instance_id: cardInstanceId,
          p_wallet_address: accountId
        });

      if (error) {
        console.error('⚒️ [FORGE] RPC Error:', error);
        throw error;
      }

      const result = data as { success: boolean; current_defense: number };
      console.log('⚒️ [FORGE] Card successfully removed:', result);

      toast({
        title: "Карта забрана из кузницы",
        description: "Броня восстановлена",
      });

      await loadForgeBayEntries();
    } catch (error: any) {
      console.error('Error removing card from forge bay:', error);
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось забрать карту из кузницы",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [accountId, toast, loadForgeBayEntries]);

  const stopRepairWithoutRecovery = useCallback(async (cardInstanceId: string) => {
    if (!accountId) return;

    try {
      setLoading(true);
      
      console.log('⚒️ [FORGE] Stopping repair without recovery via RPC v2:', cardInstanceId);

      // Используем RPC функцию с SECURITY DEFINER для обхода RLS
      const { data, error } = await supabase
        .rpc('stop_repair_without_recovery_v2', {
          p_card_instance_id: cardInstanceId,
          p_wallet_address: accountId
        });

      if (error) {
        console.error('⚒️ [FORGE] RPC Error:', error);
        throw error;
      }

      console.log('⚒️ [FORGE] Repair stopped successfully:', data);

      toast({
        title: "Ремонт остановлен",
        description: "Карта удалена из кузницы без восстановления брони",
      });

      await loadForgeBayEntries();
    } catch (error: any) {
      console.error('Error stopping repair:', error);
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось остановить ремонт",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [accountId, toast, loadForgeBayEntries]);

  const processForgeBayRepair = useCallback(async () => {
    try {
      const { error } = await supabase.rpc('process_forge_bay_repair');
      if (error) throw error;
      await loadForgeBayEntries();
    } catch (error) {
      console.error('Error processing forge bay repair:', error);
    }
  }, [loadForgeBayEntries]);

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
