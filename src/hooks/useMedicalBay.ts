import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useWallet } from '@/hooks/useWallet';

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
  const { accountId } = useWallet();

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

  const placeCardInMedicalBay = useCallback(async (cardInstanceId: string) => {
    if (!accountId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('place_card_in_medical_bay', {
        p_card_instance_id: cardInstanceId,
        p_wallet_address: accountId
      });

      if (error) throw error;

      toast({
        title: "Успешно",
        description: "Карта помещена в медпункт",
      });

      // Перезагружаем данные
      await loadMedicalBayEntries();
      
      return data;
    } catch (error) {
      console.error('Error placing card in medical bay:', error);
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось поместить карту в медпункт",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [accountId, toast, loadMedicalBayEntries]);

  const removeCardFromMedicalBay = useCallback(async (cardInstanceId: string) => {
    if (!accountId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('remove_card_from_medical_bay', {
        p_card_instance_id: cardInstanceId,
        p_wallet_address: accountId
      });

      if (error) throw error;

      toast({
        title: "Успешно",
        description: `Карта извлечена из медпункта. Восстановлено ${(data as any).healed_amount} HP`,
      });

      // Перезагружаем данные
      await loadMedicalBayEntries();
      
      return data;
    } catch (error) {
      console.error('Error removing card from medical bay:', error);
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось извлечь карту из медпункта",
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
    processMedicalBayHealing
  };
};