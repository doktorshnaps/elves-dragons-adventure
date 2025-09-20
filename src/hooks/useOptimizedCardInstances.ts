import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useWallet } from '@/hooks/useWallet';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/types/cards';

interface CardInstance {
  id: string;
  card_template_id: string;
  wallet_address: string;
  current_health: number;
  max_health: number;
  last_heal_time: string;
  card_type: string;
  card_data: any;
  created_at: string;
  updated_at: string;
}

// Глобальный стейт для минимизации запросов
let globalCardInstances: CardInstance[] = [];
let isLoading = false;
let loadPromise: Promise<CardInstance[]> | null = null;

export const useOptimizedCardInstances = () => {
  const { accountId, isConnected } = useWallet();
  const { toast } = useToast();
  const [cardInstances, setCardInstances] = useState<CardInstance[]>(globalCardInstances);
  const [loading, setLoading] = useState(false);
  const lastLoadTime = useRef<number>(0);

  // Кешированная загрузка с минимальными запросами
  const loadCardInstances = useCallback(async (force = false) => {
    if (!isConnected || !accountId) return [];
    
    const now = Date.now();
    // Кеш на 30 секунд
    if (!force && (now - lastLoadTime.current) < 30000 && globalCardInstances.length > 0) {
      return globalCardInstances;
    }

    // Избегаем одновременных запросов
    if (isLoading && loadPromise) {
      return await loadPromise;
    }

    isLoading = true;
    setLoading(true);

    loadPromise = (async () => {
      try {
        const { data, error } = await supabase
          .rpc('get_card_instances_by_wallet', { p_wallet_address: accountId });

        if (error) throw error;

        const instances = (data || []) as unknown as CardInstance[];
        globalCardInstances = instances;
        lastLoadTime.current = now;
        setCardInstances(instances);
        
        return instances;
      } catch (error) {
        console.error('Error loading card instances:', error);
        return [];
      } finally {
        isLoading = false;
        setLoading(false);
        loadPromise = null;
      }
    })();

    return await loadPromise;
  }, [accountId, isConnected]);

  // Создание экземпляра без автоматической перезагрузки
  const createCardInstance = useCallback(async (card: Card, cardType: 'hero' | 'dragon') => {
    if (!isConnected || !accountId) return null;

    try {
      const { data, error } = await supabase.rpc('create_card_instance_by_wallet', {
        p_wallet_address: accountId,
        p_card: card as any
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating card instance:', error);
      toast({
        title: 'Ошибка создания экземпляра',
        description: 'Не удалось создать экземпляр карты',
        variant: 'destructive'
      });
      return null;
    }
  }, [accountId, isConnected, toast]);

  // Обновление здоровья без перезагрузки
  const updateCardHealth = useCallback(async (instanceId: string, currentHealth: number, lastHealTime?: string) => {
    if (!isConnected || !accountId) return false;

    try {
      const { error } = await supabase.rpc('update_card_instance_health', {
        p_wallet_address: accountId,
        p_instance_id: instanceId,
        p_current_health: currentHealth,
        p_last_heal_time: lastHealTime || new Date().toISOString()
      });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating card health:', error);
      return false;
    }
  }, [accountId, isConnected]);

  // Удаление без автоматической перезагрузки
  const deleteCardInstance = useCallback(async (instanceId: string) => {
    if (!isConnected || !accountId) return false;

    const instance = cardInstances.find(ci => ci.id === instanceId);
    if (!instance) return false;

    try {
      const { error } = await supabase.rpc('remove_card_instance_by_wallet', {
        p_wallet_address: accountId,
        p_card_template_id: instance.card_template_id
      });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting card instance:', error);
      return false;
    }
  }, [accountId, isConnected, cardInstances]);

  // Удаление по template id без автоматической перезагрузки
  const deleteCardInstanceByTemplate = useCallback(async (cardTemplateId: string) => {
    if (!isConnected || !accountId) return false;

    try {
      const { error } = await supabase.rpc('remove_card_instance_by_wallet', {
        p_wallet_address: accountId,
        p_card_template_id: cardTemplateId
      });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting card instance by template:', error);
      return false;
    }
  }, [accountId, isConnected]);

  return {
    cardInstances,
    loading,
    createCardInstance,
    updateCardHealth,
    deleteCardInstance,
    deleteCardInstanceByTemplate,
    loadCardInstances
  };
};