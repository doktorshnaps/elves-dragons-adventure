import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/types/cards';
import { CardInstance } from '@/types/cardInstance';

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
  private readonly CACHE_DURATION = 30000; // 30 секунд
  private readonly BATCH_DELAY = 2000; // 2 секунды для группировки операций
  private readonly MAX_LOAD_FREQUENCY = 30000; // Максимум 1 загрузка в 30 секунд
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

    const now = Date.now();
    const lastLoad = this.lastLoadTime.get(walletAddress) || 0;
    const cached = this.cache.get(walletAddress);

    // Проверяем частоту загрузки
    if (!force && (now - lastLoad) < this.MAX_LOAD_FREQUENCY && cached) {
      console.log(`CardInstanceManager: Using cached data for ${walletAddress}`);
      return cached;
    }

    // Проверяем, идет ли уже загрузка
    if (this.loadingStates.get(walletAddress)) {
      console.log(`CardInstanceManager: Load already in progress for ${walletAddress}`);
      return cached || [];
    }

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