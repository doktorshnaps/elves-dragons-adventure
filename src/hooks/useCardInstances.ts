import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useWallet } from '@/hooks/useWallet';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/types/cards';
import { useGameData } from '@/hooks/useGameData';

export interface CardInstance {
  id: string;
  user_id?: string | null;
  wallet_address?: string;
  card_template_id: string;
  card_type: 'hero' | 'dragon' | 'workers';
  current_health: number;
  max_health: number;
  last_heal_time: string;
  is_in_medical_bay?: boolean;
  medical_bay_start_time?: string;
  medical_bay_heal_rate?: number;
  card_data: Card;
  created_at: string;
  updated_at: string;
}

export const useCardInstances = () => {
  const { accountId, isConnected } = useWallet();
  const { toast } = useToast();
  const { gameData } = useGameData();
  const [cardInstances, setCardInstances] = useState<CardInstance[]>([]);
  const [loading, setLoading] = useState(true);

  // Загрузка всех экземпляров карт пользователя
  const loadCardInstances = useCallback(async () => {
    if (!isConnected || !accountId) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .rpc('get_card_instances_by_wallet', { p_wallet_address: accountId });

      if (error) throw error;

      let list = (data || []) as unknown as CardInstance[];

      // Проверяем наличие экземпляров для всех карт из gameData
      const cards: Card[] = (gameData?.cards || []) as any;
      const selectedTeam: any[] = (gameData?.selectedTeam || []) as any;
      if (cards.length > 0 || selectedTeam.length > 0) {
        const instanceIds = new Set(list.map(ci => ci.card_template_id));
        const neededIds = new Set<string>();
        cards.forEach(c => neededIds.add(c.id));
        selectedTeam.forEach(pair => {
          if (pair?.hero?.id) neededIds.add(pair.hero.id);
          if (pair?.dragon?.id) neededIds.add(pair.dragon.id);
        });
        const missing = Array.from(neededIds).filter(id => !instanceIds.has(id));
        if (missing.length > 0) {
          console.log('🆕 Missing card instances detected, syncing from game_data:', missing);
          try {
            const { error: syncError } = await supabase.rpc('sync_card_instances_from_game_data', {
              p_wallet_address: accountId,
            });
            if (!syncError) {
              const { data: dataAfter, error: errAfter } = await supabase
                .rpc('get_card_instances_by_wallet', { p_wallet_address: accountId });
              if (!errAfter) {
                list = (dataAfter || []) as unknown as CardInstance[];
              }
            } else {
              console.warn('Sync card instances failed:', syncError.message);
            }
          } catch (e) {
            console.warn('Sync card instances exception:', e);
          }
        }
      }

      setCardInstances(list);
    } catch (error) {
      console.error('Error loading card instances:', error);
      toast({
        title: 'Ошибка загрузки карт',
        description: 'Не удалось загрузить экземпляры карт',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [accountId, isConnected, toast, gameData?.cards]);

  // Создание нового экземпляра карты
  const createCardInstance = useCallback(async (card: Card, cardType: 'hero' | 'dragon') => {
    if (!isConnected || !accountId) return null;

    try {
      const { data, error } = await supabase.rpc('create_card_instance_by_wallet', {
        p_wallet_address: accountId,
        p_card: card as any
      });

      if (error) throw error;
      // Перезагружаем список из БД, чтобы избежать расхождений
      await loadCardInstances();
      // Возвращаем заглушку с id для совместимости
      return { id: data } as unknown as CardInstance;
    } catch (error) {
      console.error('Error creating card instance:', error);
      toast({
        title: 'Ошибка создания карты',
        description: 'Не удалось создать экземпляр карты',
        variant: 'destructive'
      });
      return null;
    }
  }, [accountId, isConnected, toast, loadCardInstances]);

  // Обновление здоровья экземпляра карты
  const updateCardHealth = useCallback(async (instanceId: string, currentHealth: number, lastHealTime?: string) => {
    if (!isConnected || !accountId) return false;

    try {
      // Use RPC with SECURITY DEFINER to bypass RLS when authenticated via wallet
      const { data, error } = await supabase.rpc('update_card_instance_health', {
        p_instance_id: instanceId, // Now correctly typed as uuid
        p_wallet_address: accountId,
        p_current_health: Math.max(0, currentHealth),
        p_last_heal_time: lastHealTime ?? null
      });

      if (error) throw error;
      if (data !== true) {
        throw new Error('Update not applied');
      }

      setCardInstances(prev => 
        prev.map(instance => 
          instance.id === instanceId 
            ? { 
                ...instance, 
                current_health: Math.max(0, currentHealth), 
                ...(lastHealTime ? { last_heal_time: lastHealTime } : {})
              }
            : instance
        )
      );

      // Dispatch event for real-time sync
      const event = new CustomEvent('cardInstanceHealthUpdate', {
        detail: { instanceId, currentHealth, lastHealTime }
      });
      window.dispatchEvent(event);

      return true;
    } catch (error) {
      console.error('Error updating card health:', error);
      toast({
        title: 'Ошибка обновления здоровья',
        description: 'Не удалось обновить здоровье карты',
        variant: 'destructive'
      });
      return false;
    }
  }, [accountId, isConnected, toast]);

  // Применение урона к экземпляру карты
  const applyDamageToInstance = useCallback(async (instanceId: string, damage: number) => {
    const instance = cardInstances.find(ci => ci.id === instanceId);
    if (!instance) return false;

    const newHealth = Math.max(0, instance.current_health - damage);
    return await updateCardHealth(instanceId, newHealth);
  }, [cardInstances, updateCardHealth]);

  // Удаление экземпляра карты по instanceId (для совместимости)
  const deleteCardInstance = useCallback(async (instanceId: string) => {
    if (!isConnected || !accountId) return false;

    const instance = cardInstances.find(ci => ci.id === instanceId);
    if (!instance) return false;

    try {
      // Используем имеющуюся функцию удаления по шаблону и кошельку
      const { data, error } = await supabase.rpc('remove_card_instance_by_wallet', {
        p_wallet_address: accountId,
        p_card_template_id: instance.card_template_id
      });

      if (error) throw error;

      if (data !== true) {
        throw new Error('Delete not applied');
      }

      setCardInstances(prev => prev.filter(ci => ci.id !== instanceId));
      return true;
    } catch (error) {
      console.error('Error deleting card instance:', error);
      toast({
        title: 'Ошибка удаления карты',
        description: 'Не удалось удалить экземпляр карты',
        variant: 'destructive'
      });
      return false;
    }
  }, [accountId, isConnected, toast, cardInstances]);

  // Удаление экземпляра карты по template id (удобно при апгрейде/сжигании)
  const deleteCardInstanceByTemplate = useCallback(async (cardTemplateId: string) => {
    if (!isConnected || !accountId) return false;

    try {
      const { data, error } = await supabase.rpc('remove_card_instance_by_wallet', {
        p_wallet_address: accountId,
        p_card_template_id: cardTemplateId
      });

      if (error) throw error;
      await loadCardInstances();
      return data === true;
    } catch (error) {
      console.error('Error deleting card instance by template:', error);
      toast({
        title: 'Ошибка удаления карты',
        description: 'Не удалось удалить экземпляр карты',
        variant: 'destructive'
      });
      return false;
    }
  }, [accountId, isConnected, toast, loadCardInstances]);

  // Загрузка при инициализации (только при подключении кошелька)
  useEffect(() => {
    if (isConnected && accountId) {
      loadCardInstances();
    }
  }, [isConnected, accountId]); // Убираем loadCardInstances из зависимостей

  // Подписка на обновления в реальном времени (с debounce)
  useEffect(() => {
    if (!isConnected || !accountId) return;

    let timeoutId: NodeJS.Timeout;
    
    const channel = supabase
      .channel('card_instances_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'card_instances',
          filter: `wallet_address=eq.${accountId}`
        },
        (payload) => {
          console.log('Card instances realtime update:', payload);
          // Debounce перезагрузку чтобы избежать частых запросов
          clearTimeout(timeoutId);
          timeoutId = setTimeout(() => {
            loadCardInstances();
          }, 2000); // 2 секунды задержки
        }
      )
      .subscribe();

    return () => {
      clearTimeout(timeoutId);
      supabase.removeChannel(channel);
    };
  }, [accountId, isConnected]); // Убираем loadCardInstances из зависимостей

  return {
    cardInstances,
    loading,
    createCardInstance,
    updateCardHealth,
    applyDamageToInstance,
    deleteCardInstance,
    deleteCardInstanceByTemplate,
    loadCardInstances
  };
};