import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/types/cards';
import { CardInstance } from '@/types/cardInstance';
import { cardInstanceManager } from '@/utils/cardInstanceManager';

/**
 * Централизованный хук для управления экземплярами карт
 * Использует глобальный менеджер с кэшированием и пакетными операциями
 */
export const useCentralizedCardInstances = () => {
  const { accountId, isConnected } = useWallet();
  const { toast } = useToast();
  const [cardInstances, setCardInstances] = useState<CardInstance[]>([]);
  const [loading, setLoading] = useState(false);

  // Подписка на обновления от менеджера
  useEffect(() => {
    if (!accountId || !isConnected) {
      setCardInstances([]);
      return;
    }

    const unsubscribe = cardInstanceManager.subscribe(accountId, (instances) => {
      console.log('useCentralizedCardInstances: Received update from manager:', instances.length);
      setCardInstances(instances);
    });

    return unsubscribe;
  }, [accountId, isConnected]);

  // Загрузка экземпляров карт
  const loadCardInstances = useCallback(async (force = false) => {
    if (!isConnected || !accountId) return [];
    
    setLoading(true);
    try {
      const instances = await cardInstanceManager.getCardInstances(accountId, force);
      setCardInstances(instances);
      return instances;
    } catch (error) {
      console.error('Error loading card instances:', error);
      toast({
        title: 'Ошибка загрузки',
        description: 'Не удалось загрузить экземпляры карт',
        variant: 'destructive'
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [accountId, isConnected, toast]);

  // Создание экземпляра карты (пакетная операция)
  const createCardInstance = useCallback(async (card: Card, cardType: 'hero' | 'dragon') => {
    if (!isConnected || !accountId) return null;

    try {
      await cardInstanceManager.createCardInstance(accountId, card, cardType);
      console.log('Card instance creation queued for batch processing');
      return true;
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

  // Обновление здоровья карты (пакетная операция)
  const updateCardHealth = useCallback(async (instanceId: string, currentHealth: number, lastHealTime?: string) => {
    if (!isConnected || !accountId) return false;

    try {
      await cardInstanceManager.updateCardHealth(accountId, instanceId, currentHealth, lastHealTime);
      console.log('Card health update queued for batch processing');
      return true;
    } catch (error) {
      console.error('Error updating card health:', error);
      return false;
    }
  }, [accountId, isConnected]);

  // Удаление экземпляра карты (пакетная операция)
  const deleteCardInstance = useCallback(async (instanceId: string) => {
    if (!isConnected || !accountId) return false;

    const instance = cardInstances.find(ci => ci.id === instanceId);
    if (!instance) return false;

    try {
      await cardInstanceManager.deleteCardInstance(accountId, instance.card_template_id);
      console.log('Card instance deletion queued for batch processing');
      return true;
    } catch (error) {
      console.error('Error deleting card instance:', error);
      return false;
    }
  }, [accountId, isConnected, cardInstances]);

  // Удаление по template id (пакетная операция)
  const deleteCardInstanceByTemplate = useCallback(async (cardTemplateId: string) => {
    if (!isConnected || !accountId) return false;

    try {
      await cardInstanceManager.deleteCardInstance(accountId, cardTemplateId);
      console.log('Card instance deletion by template queued for batch processing');
      return true;
    } catch (error) {
      console.error('Error deleting card instance by template:', error);
      return false;
    }
  }, [accountId, isConnected]);

  // Принудительная обработка всех пакетных операций
  const flushPendingOperations = useCallback(async () => {
    try {
      await cardInstanceManager.flushAll();
      console.log('All pending card instance operations processed');
    } catch (error) {
      console.error('Error flushing pending operations:', error);
    }
  }, []);

  return {
    cardInstances,
    loading,
    createCardInstance,
    updateCardHealth,
    deleteCardInstance,
    deleteCardInstanceByTemplate,
    loadCardInstances,
    flushPendingOperations
  };
};