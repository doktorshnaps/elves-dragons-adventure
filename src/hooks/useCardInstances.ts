import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useWallet } from '@/hooks/useWallet';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/types/cards';

export interface CardInstance {
  id: string;
  user_id?: string | null;
  wallet_address?: string;
  card_template_id: string;
  card_type: 'hero' | 'dragon';
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
  const [cardInstances, setCardInstances] = useState<CardInstance[]>([]);
  const [loading, setLoading] = useState(true);

  // Загрузка всех экземпляров карт пользователя
  const loadCardInstances = useCallback(async () => {
    if (!isConnected || !accountId) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('card_instances')
        .select('*')
        .eq('wallet_address', accountId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCardInstances((data || []) as unknown as CardInstance[]);
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
  }, [accountId, isConnected, toast]);

  // Создание нового экземпляра карты
  const createCardInstance = useCallback(async (card: Card, cardType: 'hero' | 'dragon') => {
    if (!isConnected || !accountId) return null;

    try {
      const instanceData = {
        wallet_address: accountId,
        user_id: null,
        card_template_id: card.id,
        card_type: cardType,
        current_health: card.health,
        max_health: card.health,
        last_heal_time: new Date().toISOString(),
        card_data: card as any
      };

      const { data, error } = await supabase
        .from('card_instances')
        .insert(instanceData)
        .select()
        .single();

      if (error) throw error;
      
      setCardInstances(prev => [data as unknown as CardInstance, ...prev]);
      return data as unknown as CardInstance;
    } catch (error) {
      console.error('Error creating card instance:', error);
      toast({
        title: 'Ошибка создания карты',
        description: 'Не удалось создать экземпляр карты',
        variant: 'destructive'
      });
      return null;
    }
  }, [accountId, isConnected, toast]);

  // Обновление здоровья экземпляра карты
  const updateCardHealth = useCallback(async (instanceId: string, currentHealth: number, lastHealTime?: string) => {
    if (!isConnected || !accountId) return false;

    try {
      // Use RPC with SECURITY DEFINER to bypass RLS when authenticated via wallet
      const { data, error } = await supabase.rpc('update_card_instance_health', {
        p_instance_id: instanceId,
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

  // Удаление экземпляра карты
  const deleteCardInstance = useCallback(async (instanceId: string) => {
    if (!isConnected || !accountId) return false;

    try {
      const { error } = await supabase
        .from('card_instances')
        .delete()
        .eq('id', instanceId)
        .eq('wallet_address', accountId);

      if (error) throw error;

      setCardInstances(prev => prev.filter(instance => instance.id !== instanceId));
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
  }, [accountId, isConnected, toast]);

  // Загрузка при инициализации
  useEffect(() => {
    loadCardInstances();
  }, [loadCardInstances]);

  // Подписка на обновления в реальном времени
  useEffect(() => {
    if (!isConnected || !accountId) return;

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
          loadCardInstances();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [accountId, isConnected, loadCardInstances]);

  return {
    cardInstances,
    loading,
    createCardInstance,
    updateCardHealth,
    applyDamageToInstance,
    deleteCardInstance,
    loadCardInstances
  };
};