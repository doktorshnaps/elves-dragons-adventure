import { useCallback, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useWalletContext } from '@/contexts/WalletConnectContext';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/types/cards';
import { useGameStore } from '@/stores/gameStore';

export interface CardInstance {
  id: string;
  user_id?: string | null;
  wallet_address?: string;
  card_template_id: string;
  card_type: 'hero' | 'dragon' | 'workers';
  current_health: number;
  max_health: number;
  current_defense: number;
  max_defense: number;
  last_heal_time: string;
  is_in_medical_bay?: boolean;
  medical_bay_start_time?: string;
  medical_bay_heal_rate?: number;
  monster_kills: number;
  card_data: Card;
  created_at: string;
  updated_at: string;
  nft_contract_id?: string;
  nft_token_id?: string;
}

export const useCardInstances = () => {
  const { accountId, selector, isLoading: walletLoading } = useWalletContext();
  const isConnected = !!accountId;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Загрузка всех экземпляров карт пользователя через React Query
  const { 
    data: cardInstances = [], 
    isLoading: loading,
    refetch: loadCardInstances 
  } = useQuery({
    queryKey: ['cardInstances', accountId],
    queryFn: async () => {
      if (!isConnected || !accountId) {
        return [];
      }

      console.log('🃏 [useCardInstances] Fetching from DB for:', accountId);
      const { data, error } = await supabase
        .rpc('get_card_instances_by_wallet', { p_wallet_address: accountId });

      if (error) {
        console.error('❌ Error loading card instances:', error);
        toast({
          title: 'Ошибка загрузки карт',
          description: 'Не удалось загрузить экземпляры карт',
          variant: 'destructive'
        });
        throw error;
      }

      console.log('✅ [useCardInstances] Loaded', data?.length || 0, 'card instances');
      return (data || []) as unknown as CardInstance[];
    },
    enabled: isConnected && !!accountId && !walletLoading && !!selector,
    staleTime: 5 * 60 * 1000, // 5 минут - агрессивное кеширование
    gcTime: 10 * 60 * 1000, // 10 минут
    refetchOnMount: false, // НЕ перезагружать при каждом монтировании
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  // Создание нового экземпляра карты
  const createCardInstance = useCallback(async (card: Card, cardType: 'hero' | 'dragon') => {
    if (!isConnected || !accountId) return null;

    try {
      const { data, error } = await supabase.rpc('create_card_instance_by_wallet', {
        p_wallet_address: accountId,
        p_card: card as any
      });

      if (error) throw error;
      // Invalidate query to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['cardInstances', accountId] });
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

      // Update React Query cache
      queryClient.setQueryData(['cardInstances', accountId], (prev: CardInstance[] = []) => 
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
  }, [accountId, isConnected, toast, queryClient]);

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
        // Пытаемся удалить через SECURITY DEFINER RPC (обходит RLS по wallet)
        console.log('🗑️ deleteCardInstance try exact:', instanceId, 'wallet:', accountId);
        let rpcOk = false;

        // 1) Основной способ: remove_card_instance_exact (SECURITY DEFINER)
        try {
          const { data: exactRes, error: exactErr } = await supabase.rpc('remove_card_instance_exact', {
            p_instance_id: instanceId,
            p_wallet_address: accountId
          });
          if (exactErr) {
            console.warn('remove_card_instance_exact error:', exactErr);
          } else {
            rpcOk = exactRes === true;
          }
        } catch (e) {
          console.warn('remove_card_instance_exact threw:', e);
        }

        // 2) Фоллбек: remove_card_instance_by_id (если exact недоступна)
        if (!rpcOk) {
          console.log('↩️ Fallback remove_card_instance_by_id for', instanceId);
          const { data, error } = await supabase.rpc('remove_card_instance_by_id', {
            p_instance_id: instanceId,
            p_wallet_address: accountId
          });
          if (error) throw error;
          rpcOk = data === true;
        }

        if (!rpcOk) {
          throw new Error('Delete not applied');
        }

        // Update React Query cache
        queryClient.setQueryData(['cardInstances', accountId], (prev: CardInstance[] = []) => 
          prev.filter(ci => ci.id !== instanceId)
        );
        console.log('✅ deleteCardInstance success:', instanceId);
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
  }, [accountId, isConnected, toast, cardInstances, queryClient]);

  // Удаление экземпляра карты по template id (удобно при апгрейде/сжигании)
  const deleteCardInstanceByTemplate = useCallback(async (cardTemplateId: string) => {
    if (!isConnected || !accountId) return false;

    try {
      const { data, error } = await supabase.rpc('remove_card_instance_by_wallet', {
        p_wallet_address: accountId,
        p_card_template_id: cardTemplateId
      });

      if (error) throw error;
      // Invalidate query to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['cardInstances', accountId] });
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
  }, [accountId, isConnected, toast, queryClient]);

  // Инкремент убийств монстров для карты
  const incrementMonsterKills = useCallback(async (cardTemplateId: string, killsToAdd: number = 1) => {
    if (!isConnected || !accountId) {
      console.warn('incrementMonsterKills: Not connected or no accountId');
      return false;
    }

    console.log('incrementMonsterKills called for:', cardTemplateId, 'in instances:', cardInstances.map(ci => ci.card_template_id));
    
    const instance = cardInstances.find(ci => ci.card_template_id === cardTemplateId);
    if (!instance) {
      console.warn(`incrementMonsterKills: No instance found for template ${cardTemplateId}`);
      return false;
    }

    try {
      console.log('Calling increment_card_monster_kills RPC for:', cardTemplateId);
      const { error } = await supabase.rpc('increment_card_monster_kills', {
        p_card_template_id: cardTemplateId,
        p_wallet_address: accountId,
        p_kills_to_add: killsToAdd
      });

      if (error) {
        console.error('RPC error:', error);
        throw error;
      }

      console.log('Successfully incremented monster kills for:', cardTemplateId);

      // Update React Query cache
      queryClient.setQueryData(['cardInstances', accountId], (prev: CardInstance[] = []) =>
        prev.map(ci =>
          ci.card_template_id === cardTemplateId
            ? { ...ci, monster_kills: ci.monster_kills + killsToAdd }
            : ci
        )
      );

      return true;
    } catch (error) {
      console.error('Error incrementing monster kills:', error);
      return false;
    }
  }, [accountId, isConnected, cardInstances, queryClient]);

  // Event listener for manual reload trigger
  useEffect(() => {
    const handleCardInstancesUpdate = () => {
      console.log('🔄 Received cardInstancesUpdate event, invalidating card instances cache');
      queryClient.invalidateQueries({ queryKey: ['cardInstances', accountId] });
    };

    window.addEventListener('cardInstancesUpdate', handleCardInstancesUpdate);
    return () => window.removeEventListener('cardInstancesUpdate', handleCardInstancesUpdate);
  }, [accountId, queryClient]);

  // КРИТИЧНО: Подписка на обновления в реальном времени для автоматической синхронизации
  // Особенно важно для рабочих, выдаваемых через админ-панель
  // НО ОТКЛЮЧАЕМ ВО ВРЕМЯ БОЕВ для снижения нагрузки
  useEffect(() => {
    if (!isConnected || !accountId) return;

    // Проверяем, идет ли бой
    const activeBattleInProgress = useGameStore.getState().activeBattleInProgress;
    if (activeBattleInProgress) {
      console.log('⏸️ [useCardInstances] Skipping Real-time subscription during active battle');
      return;
    }

    console.log('🔔 [useCardInstances] Setting up Real-time subscription for:', accountId);

    const channel = supabase
      .channel('card_instances_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'card_instances',
          filter: `wallet_address=eq.${accountId}`
        },
        (payload) => {
          console.log('📥 [useCardInstances] New card instance added via Real-time:', payload);
          queryClient.invalidateQueries({ queryKey: ['cardInstances', accountId] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'card_instances',
          filter: `wallet_address=eq.${accountId}`
        },
        (payload) => {
          console.log('🗑️ [useCardInstances] Card instance deleted via Real-time:', payload);
          queryClient.invalidateQueries({ queryKey: ['cardInstances', accountId] });
        }
      )
      .subscribe();

    return () => {
      console.log('🔕 [useCardInstances] Cleaning up Real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [accountId, isConnected, queryClient]);

  return {
    cardInstances,
    loading,
    createCardInstance,
    updateCardHealth,
    applyDamageToInstance,
    deleteCardInstance,
    deleteCardInstanceByTemplate,
    incrementMonsterKills,
    loadCardInstances: () => loadCardInstances() // Wrap refetch as function
  };
};