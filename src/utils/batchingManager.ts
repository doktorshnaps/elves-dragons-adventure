/**
 * Централизованная система батчинга для оптимизации запросов к БД
 * 
 * Проблемы, которые решает:
 * 1. Множественные отдельные UPDATE запросы
 * 2. Race conditions при параллельных обновлениях
 * 3. Избыточная нагрузка на БД
 * 
 * Решение:
 * - Группирует обновления в течение таймфрейма
 * - Объединяет изменения одних и тех же полей
 * - Отправляет один агрегированный запрос
 */

interface BatchUpdate {
  [key: string]: any;
}

interface BatchCallback {
  resolve: (value: any) => void;
  reject: (error: any) => void;
}

class BatchingManager {
  private batchTimeout: NodeJS.Timeout | null = null;
  private pendingUpdates: BatchUpdate = {};
  private callbacks: BatchCallback[] = [];
  private isProcessing = false;
  private updateHandler: ((updates: BatchUpdate) => Promise<any>) | null = null;
  
  // Конфигурация
  private readonly BATCH_DELAY = 100; // Задержка перед отправкой батча (мс)
  private readonly MAX_BATCH_SIZE = 50; // Максимальное количество обновлений в батче
  
  /**
   * Устанавливает обработчик для выполнения батчей
   */
  setUpdateHandler(handler: (updates: BatchUpdate) => Promise<any>) {
    this.updateHandler = handler;
  }
  
  /**
   * Добавляет обновление в батч
   */
  async addUpdate(updates: BatchUpdate): Promise<any> {
    return new Promise((resolve, reject) => {
      // Объединяем обновления (новые значения перезаписывают старые)
      this.pendingUpdates = {
        ...this.pendingUpdates,
        ...updates
      };
      
      // Сохраняем callback для разрешения промиса
      this.callbacks.push({ resolve, reject });
      
      // Если достигли максимального размера батча, обрабатываем немедленно
      if (Object.keys(this.pendingUpdates).length >= this.MAX_BATCH_SIZE) {
        this.processBatch();
        return;
      }
      
      // Иначе запускаем/перезапускаем таймер
      this.scheduleBatch();
    });
  }
  
  /**
   * Планирует выполнение батча
   */
  private scheduleBatch() {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
    }
    
    this.batchTimeout = setTimeout(() => {
      this.processBatch();
    }, this.BATCH_DELAY);
  }
  
  /**
   * Обрабатывает накопленный батч
   */
  private async processBatch() {
    if (this.isProcessing || Object.keys(this.pendingUpdates).length === 0) {
      return;
    }
    
    this.isProcessing = true;
    
    // Сохраняем текущий батч
    const updates = { ...this.pendingUpdates };
    const callbacks = [...this.callbacks];
    
    // Очищаем для следующего батча
    this.pendingUpdates = {};
    this.callbacks = [];
    
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }
    
    try {
      if (!this.updateHandler) {
        throw new Error('Update handler not set');
      }
      
      console.log('📦 Processing batch:', {
        updateCount: Object.keys(updates).length,
        callbackCount: callbacks.length,
        updates
      });
      
      const result = await this.updateHandler(updates);
      
      // Разрешаем все промисы успехом
      callbacks.forEach(cb => cb.resolve(result));
    } catch (error) {
      console.error('❌ Batch processing error:', error);
      
      // Отклоняем все промисы с ошибкой
      callbacks.forEach(cb => cb.reject(error));
    } finally {
      this.isProcessing = false;
    }
  }
  
  /**
   * Принудительно обрабатывает текущий батч
   */
  async flush(): Promise<void> {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }
    
    await this.processBatch();
  }
  
  /**
   * Очищает все накопленные обновления
   */
  clear() {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }
    
    this.pendingUpdates = {};
    
    // Отклоняем все ожидающие промисы
    this.callbacks.forEach(cb => 
      cb.reject(new Error('Batch cleared'))
    );
    this.callbacks = [];
  }
}

// Глобальный экземпляр для всего приложения
export const globalBatchManager = new BatchingManager();

/**
 * Debounced батчинг для ресурсов (дерево, камень, железо)
 * Используется для частых обновлений при сборе ресурсов
 */
class ResourceBatcher {
  private resourceUpdates: BatchUpdate = {};
  private debounceTimeout: NodeJS.Timeout | null = null;
  private readonly DEBOUNCE_DELAY = 500; // Задержка для debounce (мс)
  
  constructor(private batchManager: BatchingManager) {}
  
  /**
   * Обновляет ресурсы с debouncing
   */
  updateResource(resourceType: 'wood' | 'stone' | 'iron' | 'gold', amount: number) {
    this.resourceUpdates[resourceType] = amount;
    
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }
    
    this.debounceTimeout = setTimeout(() => {
      this.flush();
    }, this.DEBOUNCE_DELAY);
  }
  
  /**
   * Немедленно отправляет накопленные обновления ресурсов
   */
  async flush() {
    if (Object.keys(this.resourceUpdates).length === 0) {
      return;
    }
    
    const updates = { ...this.resourceUpdates };
    this.resourceUpdates = {};
    
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
      this.debounceTimeout = null;
    }
    
    console.log('💎 Flushing resource updates:', updates);
    
    return this.batchManager.addUpdate(updates);
  }
}

export const resourceBatcher = new ResourceBatcher(globalBatchManager);

/**
 * Специализированный батчер для баланса
 * Агрегирует изменения баланса (+=, -=)
 */
class BalanceBatcher {
  private balanceChanges: number = 0;
  private debounceTimeout: NodeJS.Timeout | null = null;
  private currentBalance: number = 0;
  private readonly DEBOUNCE_DELAY = 300;
  
  constructor(private batchManager: BatchingManager) {}
  
  /**
   * Устанавливает текущий баланс (для правильного подсчета изменений)
   */
  setCurrentBalance(balance: number) {
    this.currentBalance = balance;
  }
  
  /**
   * Добавляет изменение баланса (может быть отрицательным)
   */
  addChange(change: number) {
    this.balanceChanges += change;
    
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }
    
    this.debounceTimeout = setTimeout(() => {
      this.flush();
    }, this.DEBOUNCE_DELAY);
  }
  
  /**
   * Отправляет накопленные изменения баланса
   */
  async flush() {
    if (this.balanceChanges === 0) {
      return;
    }
    
    const newBalance = this.currentBalance + this.balanceChanges;
    this.balanceChanges = 0;
    this.currentBalance = newBalance;
    
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
      this.debounceTimeout = null;
    }
    
    console.log('💰 Flushing balance update:', newBalance);
    
    return this.batchManager.addUpdate({ balance: newBalance });
  }
}

export const balanceBatcher = new BalanceBatcher(globalBatchManager);

/**
 * Утилита для создания батчированной версии функции
 */
export function batchify<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  getUpdates: (...args: Parameters<T>) => BatchUpdate,
  batchManager: BatchingManager = globalBatchManager
): T {
  return (async (...args: Parameters<T>) => {
    const updates = getUpdates(...args);
    return batchManager.addUpdate(updates);
  }) as T;
}

/**
 * Хук для автоматического flush при размонтировании компонента
 */
export function useAutoFlush() {
  if (typeof window !== 'undefined') {
    // Flush при закрытии страницы
    window.addEventListener('beforeunload', () => {
      globalBatchManager.flush();
      resourceBatcher.flush();
      balanceBatcher.flush();
    });
    
    // Flush при уходе со страницы (для SPA)
    window.addEventListener('popstate', () => {
      globalBatchManager.flush();
      resourceBatcher.flush();
      balanceBatcher.flush();
    });
  }
}

// Периодический flush для предотвращения потери данных
setInterval(() => {
  globalBatchManager.flush();
  resourceBatcher.flush();
  balanceBatcher.flush();
}, 5000); // Каждые 5 секунд
