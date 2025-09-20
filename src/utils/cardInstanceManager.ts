import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/types/cards';
import { CardInstance } from '@/types/cardInstance';

const GLOBAL_LOADING_LOCK: Set<string> = new Set();

interface BatchOperation {
  type: 'create' | 'delete' | 'update';
  data: any;
  timestamp: number;
}

/**
 * Централизованный менеджер экземпляров карт с кэшированием и пакетными операциями
 */
class CardInstanceManager {
  private cache: Map<string, CardInstance[]> = new Map();
  private lastLoadTime: Map<string, number> = new Map();
  private pendingOperations: Map<string, BatchOperation[]> = new Map();
  private batchTimeout: NodeJS.Timeout | null = null;
  private readonly CACHE_DURATION = 60000; // Увеличиваем до 60 секунд
  private readonly BATCH_DELAY = 5000; // Увеличиваем до 5 секунд для группировки операций
  private readonly MAX_LOAD_FREQUENCY = 60000; // Увеличиваем до 60 секунд между загрузками
  private subscribers: Map<string, Set<(instances: CardInstance[]) => void>> = new Map();
  private loadingStates: Map<string, boolean> = new Map();

  /**
   * Подписка на обновления экземпляров карт
   */
  subscribe(walletAddress: string, callback: (instances: CardInstance[]) => void) {
    if (!this.subscribers.has(walletAddress)) {
      this.subscribers.set(walletAddress, new Set());
    }
    this.subscribers.get(walletAddress)!.add(callback);

    // Возвращаем функцию отписки
    return () => {
      const subs = this.subscribers.get(walletAddress);
      if (subs) {
        subs.delete(callback);
        if (subs.size === 0) {
          this.subscribers.delete(walletAddress);
        }
      }
    };
  }

  /**
   * Уведомление подписчиков об обновлениях
   */
  private notifySubscribers(walletAddress: string, instances: CardInstance[]) {
    const subs = this.subscribers.get(walletAddress);
    if (subs) {
      subs.forEach(callback => callback(instances));
    }
  }

  /**
   * Получение экземпляров карт с кэшированием
   */
  async getCardInstances(walletAddress: string, force = false): Promise<CardInstance[]> {
    if (!walletAddress) return [];

    // КРИТИЧЕСКОЕ логирование для отслеживания массовых вызовов
    console.trace(`CardInstanceManager.getCardInstances called for ${walletAddress}, force=${force}`);

    // ГЛОБАЛЬНАЯ ЗАЩИТА от множественных вызовов
    const lockKey = `loading_${walletAddress}`;
    if (GLOBAL_LOADING_LOCK.has(lockKey)) {
      console.warn(`BLOCKED: Already loading ${walletAddress} globally!`);
      return this.cache.get(walletAddress) || [];
    }

    const now = Date.now();
    const lastLoad = this.lastLoadTime.get(walletAddress) || 0;
    const cached = this.cache.get(walletAddress);

    // Строгая проверка частоты загрузки - увеличиваем до 60 секунд
    if (!force && (now - lastLoad) < 60000 && cached) {
      console.log(`CardInstanceManager: Using cached data for ${walletAddress}, age: ${Math.round((now - lastLoad) / 1000)}s`);
      return cached;
    }

    // Проверяем, идет ли уже загрузка
    if (this.loadingStates.get(walletAddress)) {
      console.log(`CardInstanceManager: Load already in progress for ${walletAddress}, returning cached data`);
      return cached || [];
    }

    // Устанавливаем глобальную блокировку
    GLOBAL_LOADING_LOCK.add(lockKey);

    this.loadingStates.set(walletAddress, true);

    try {
      console.log(`CardInstanceManager: Loading from DB for ${walletAddress}`);
      const { data, error } = await supabase
        .rpc('get_card_instances_by_wallet', { p_wallet_address: walletAddress });

      if (error) throw error;

      const instances = (data || []) as unknown as CardInstance[];
      this.cache.set(walletAddress, instances);
      this.lastLoadTime.set(walletAddress, now);
      
      this.notifySubscribers(walletAddress, instances);
      return instances;
    } catch (error) {
      console.error('CardInstanceManager: Error loading instances:', error);
      return cached || [];
    } finally {
      this.loadingStates.set(walletAddress, false);
      GLOBAL_LOADING_LOCK.delete(`loading_${walletAddress}`);
    }
  }

  /**
   * Добавление операции в пакет
   */
  private addToBatch(walletAddress: string, operation: BatchOperation) {
    if (!this.pendingOperations.has(walletAddress)) {
      this.pendingOperations.set(walletAddress, []);
    }
    
    const operations = this.pendingOperations.get(walletAddress)!;
    operations.push(operation);

    // Сбрасываем текущий таймер и устанавливаем новый
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
    }

    this.batchTimeout = setTimeout(() => {
      this.processBatch(walletAddress);
    }, this.BATCH_DELAY);
  }

  /**
   * Обработка пакета операций
   */
  private async processBatch(walletAddress: string) {
    const operations = this.pendingOperations.get(walletAddress);
    if (!operations || operations.length === 0) return;

    console.log(`CardInstanceManager: Processing batch of ${operations.length} operations for ${walletAddress}`);

    // Группируем операции по типу
    const creates = operations.filter(op => op.type === 'create');
    const deletes = operations.filter(op => op.type === 'delete');
    const updates = operations.filter(op => op.type === 'update');

    try {
      // Выполняем операции последовательно по типам
      for (const op of creates) {
        await this.executeCreate(walletAddress, op.data);
      }

      for (const op of deletes) {
        await this.executeDelete(walletAddress, op.data);
      }

      for (const op of updates) {
        await this.executeUpdate(walletAddress, op.data);
      }

      // Очищаем пакет после успешного выполнения
      this.pendingOperations.delete(walletAddress);
      
      // Обновляем кэш после пакетной операции
      await this.refreshCache(walletAddress);

    } catch (error) {
      console.error('CardInstanceManager: Batch processing failed:', error);
      // Не очищаем пакет при ошибке, попробуем позже
    }
  }

  /**
   * Обновление кэша без загрузки с сервера
   */
  private async refreshCache(walletAddress: string) {
    const fresh = await this.getCardInstances(walletAddress, true);
    this.notifySubscribers(walletAddress, fresh);
  }

  /**
   * Создание экземпляра карты (добавляется в пакет)
   */
  async createCardInstance(walletAddress: string, card: Card, cardType: 'hero' | 'dragon'): Promise<void> {
    // КРИТИЧЕСКИЙ ЛОГ: отслеживаем откуда создаются рабочие
    if (card.type === 'workers' || card.name?.includes('Батрак') || card.name?.includes('Носильщик') || card.name?.includes('Мастер') || card.name?.includes('Архимастер')) {
      console.error('🚨 WORKER CREATION DETECTED:', {
        walletAddress,
        cardName: card.name,
        cardType: card.type,
        cardId: card.id,
        stackTrace: new Error().stack
      });
    }
    
    this.addToBatch(walletAddress, {
      type: 'create',
      data: { card, cardType },
      timestamp: Date.now()
    });
  }

  /**
   * Удаление экземпляра карты (добавляется в пакет)
   */
  async deleteCardInstance(walletAddress: string, cardTemplateId: string): Promise<void> {
    this.addToBatch(walletAddress, {
      type: 'delete',
      data: { cardTemplateId },
      timestamp: Date.now()
    });
  }

  /**
   * Обновление здоровья (добавляется в пакет)
   */
  async updateCardHealth(walletAddress: string, instanceId: string, currentHealth: number, lastHealTime?: string): Promise<void> {
    this.addToBatch(walletAddress, {
      type: 'update',
      data: { instanceId, currentHealth, lastHealTime },
      timestamp: Date.now()
    });
  }

  /**
   * Выполнение создания экземпляра
   */
  private async executeCreate(walletAddress: string, data: any): Promise<void> {
    // КРИТИЧЕСКИЙ ЛОГ: отслеживаем откуда создаются рабочие на уровне executeCreate
    if (data.card?.type === 'workers' || data.card?.name?.includes('Батрак') || data.card?.name?.includes('Носильщик') || data.card?.name?.includes('Мастер') || data.card?.name?.includes('Архимастер')) {
      console.error('🚨 EXECUTECREATEWORKER:', {
        walletAddress,
        cardName: data.card?.name,
        cardType: data.card?.type,
        cardId: data.card?.id,
        stackTrace: new Error().stack
      });
    }
    
    const { data: result, error } = await supabase.rpc('create_card_instance_by_wallet', {
      p_wallet_address: walletAddress,
      p_card: data.card as any
    });

    if (error) throw error;
  }

  /**
   * Выполнение удаления экземпляра
   */
  private async executeDelete(walletAddress: string, data: any): Promise<void> {
    const { error } = await supabase.rpc('remove_card_instance_by_wallet', {
      p_wallet_address: walletAddress,
      p_card_template_id: data.cardTemplateId
    });

    if (error) throw error;
  }

  /**
   * Выполнение обновления здоровья
   */
  private async executeUpdate(walletAddress: string, data: any): Promise<void> {
    const { error } = await supabase.rpc('update_card_instance_health', {
      p_instance_id: data.instanceId,
      p_wallet_address: walletAddress,
      p_current_health: data.currentHealth,
      p_last_heal_time: data.lastHealTime || new Date().toISOString()
    });

    if (error) throw error;
  }

  /**
   * Принудительная обработка всех пакетов
   */
  async flushAll(): Promise<void> {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }

    const wallets = Array.from(this.pendingOperations.keys());
    for (const wallet of wallets) {
      await this.processBatch(wallet);
    }
  }

  /**
   * Очистка кэша для кошелька
   */
  clearCache(walletAddress: string) {
    this.cache.delete(walletAddress);
    this.lastLoadTime.delete(walletAddress);
  }

  /**
   * Очистка всех данных
   */
  clearAll() {
    this.cache.clear();
    this.lastLoadTime.clear();
    this.pendingOperations.clear();
    this.subscribers.clear();
    this.loadingStates.clear();
    
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }
  }
}

// Экспортируем единственный экземпляр
export const cardInstanceManager = new CardInstanceManager();