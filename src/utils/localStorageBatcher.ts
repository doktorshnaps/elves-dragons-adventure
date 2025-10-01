import debounce from 'lodash.debounce';

/**
 * Батчер для localStorage операций
 * Объединяет множественные записи в одну операцию
 */
class LocalStorageBatcher {
  private pendingUpdates: Map<string, any> = new Map();
  private isProcessing = false;

  /**
   * Добавить запись в очередь
   */
  setItem(key: string, value: any): void {
    this.pendingUpdates.set(key, value);
    this.scheduleBatch();
  }

  /**
   * Получить значение (синхронно, напрямую из localStorage)
   */
  getItem(key: string): string | null {
    // Сначала проверяем pending updates
    if (this.pendingUpdates.has(key)) {
      const value = this.pendingUpdates.get(key);
      return typeof value === 'string' ? value : JSON.stringify(value);
    }
    return localStorage.getItem(key);
  }

  /**
   * Удалить значение
   */
  removeItem(key: string): void {
    this.pendingUpdates.delete(key);
    localStorage.removeItem(key);
  }

  /**
   * Запланировать батч операцию
   */
  private scheduleBatch = debounce(() => {
    this.processBatch();
  }, 100, { maxWait: 500 });

  /**
   * Обработать все накопленные операции
   */
  private processBatch(): void {
    if (this.isProcessing || this.pendingUpdates.size === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      console.log(`📦 Processing ${this.pendingUpdates.size} localStorage updates`);
      
      // Выполняем все операции за один проход
      this.pendingUpdates.forEach((value, key) => {
        try {
          const serialized = typeof value === 'string' 
            ? value 
            : JSON.stringify(value);
          localStorage.setItem(key, serialized);
        } catch (error) {
          console.error(`Failed to save ${key} to localStorage:`, error);
        }
      });

      this.pendingUpdates.clear();
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Немедленно записать все накопленные изменения
   */
  flush(): void {
    this.scheduleBatch.cancel();
    this.processBatch();
  }
}

// Singleton instance
export const localStorageBatcher = new LocalStorageBatcher();

/**
 * Хук для использования батчера в React компонентах
 */
export const useBatchedLocalStorage = () => {
  return {
    setItem: (key: string, value: any) => localStorageBatcher.setItem(key, value),
    getItem: (key: string) => localStorageBatcher.getItem(key),
    removeItem: (key: string) => localStorageBatcher.removeItem(key),
    flush: () => localStorageBatcher.flush()
  };
};

// Flush при закрытии/перезагрузке страницы
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    localStorageBatcher.flush();
  });

  // Также flush периодически (каждые 5 секунд)
  setInterval(() => {
    localStorageBatcher.flush();
  }, 5000);
}
