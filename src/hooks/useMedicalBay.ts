import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useWalletContext } from '@/contexts/WalletConnectContext';
import { useGameData } from '@/hooks/useGameData';
import { useGameStore } from '@/stores/gameStore';

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
    card_data: any;
  };
}

export const useMedicalBay = () => {
  const [medicalBayEntries, setMedicalBayEntries] = useState<MedicalBayEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { accountId } = useWalletContext();
  const { gameData, updateGameData } = useGameData();

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
          card_data: row.ci_card_data,
        },
      })) || [];

      console.log('🏥 Loaded medical bay entries:', mapped.length, 'entries');
      setMedicalBayEntries(mapped);
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
    if (!accountId) return;

    // Проверяем, есть ли назначенные рабочие в медпункт
    const hasWorkersInMedical = gameData?.activeWorkers?.some((worker: any) => worker.assignedBuilding === 'medical') || false;
    if (!hasWorkersInMedical) {
      toast({
        title: "Медпункт неактивен",
        description: "Назначьте рабочих в медпункт для проведения лечения",
        variant: "destructive"
      });
      return;
    }

    // Проверяем, есть ли активное подземелье
    const isActiveBattle = localStorage.getItem('activeBattleInProgress') === 'true';
    if (isActiveBattle) {
      toast({
        title: "Нельзя отправить на лечение",
        description: "Карта используется в активном подземелье. Завершите бой или сдайтесь, чтобы отправить карту на лечение.",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      console.log('🏥 Placing card in medical bay:', cardInstanceIdOrTemplateId);

      // Пытаемся найти экземпляр карты
      let { data: instance, error: instErr } = await supabase
        .from('card_instances')
        .select('id, card_template_id')
        .eq('id', cardInstanceIdOrTemplateId)
        .maybeSingle();
      
      // Если не найден по ID, ищем по template_id
      if (!instance || instErr) {
        console.log('🏥 Card instance not found by ID, searching by template_id...');
        const { data: instanceByTemplate, error: templateErr } = await supabase
          .from('card_instances')
          .select('id, card_template_id')
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
      
      const { data, error } = await supabase.rpc('add_card_to_medical_bay', {
        p_card_instance_id: actualInstanceId,
        p_wallet_address: accountId
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

      // Перезагружаем данные
      await loadMedicalBayEntries();
      
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
  }, [accountId, toast, loadMedicalBayEntries, gameData.selectedTeam, updateGameData]);

  const removeCardFromMedicalBay = useCallback(async (cardInstanceId: string) => {
    if (!accountId) return;

    try {
      setLoading(true);
      console.log('🏥 Removing card from medical bay:', cardInstanceId);

      // First, ensure healing is applied in DB for ready entries
      const { error: healErr } = await supabase.rpc('process_medical_bay_healing');
      if (healErr) {
        console.warn('🏥 process_medical_bay_healing warning:', healErr.message);
      }

      // Then remove the specific card from medical bay
      const { error } = await supabase.rpc('remove_card_from_medical_bay', {
        p_card_instance_id: cardInstanceId
      });

      if (error) throw error;

      toast({
        title: 'Успешно',
        description: 'Карта извлечена из медпункта. Здоровье восстановлено.',
      });

      // Reload entries to reflect changes
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
  }, [accountId, toast, loadMedicalBayEntries]);

  const stopHealingWithoutRecovery = useCallback(async (cardInstanceId: string) => {
    if (!accountId) return;

    try {
      setLoading(true);
      console.log('🏥 Stopping healing without recovery:', cardInstanceId);
      
      // Используем RPC функцию для безопасного удаления из медпункта
      const { error } = await supabase.rpc('stop_healing_without_recovery', {
        p_card_instance_id: cardInstanceId
      });

      if (error) throw error;

      toast({
        title: "Лечение остановлено",
        description: "Карта извлечена из медпункта без восстановления здоровья",
      });

      // Перезагружаем данные
      await loadMedicalBayEntries();
      
    } catch (error) {
      console.error('Error stopping healing:', error);
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось остановить лечение",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [accountId, toast, loadMedicalBayEntries]);

  const processMedicalBayHealing = useCallback(async () => {
    try {
      console.log('🏥 Processing medical bay healing...');
      const { error } = await supabase.rpc('process_medical_bay_healing');
      if (error) throw error;
      
      console.log('🏥 Medical bay healing processed, reloading entries...');
      // Перезагружаем данные после обработки лечения
      await loadMedicalBayEntries();
    } catch (error) {
      console.error('🏥 Error processing medical bay healing:', error);
    }
  }, [loadMedicalBayEntries]);

  return {
    medicalBayEntries,
    loading,
    loadMedicalBayEntries,
    placeCardInMedicalBay,
    removeCardFromMedicalBay,
    stopHealingWithoutRecovery,
    processMedicalBayHealing
  };
};