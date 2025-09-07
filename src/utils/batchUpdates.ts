import { BatchUpdate, GameData } from '@/types/gameState';

class BatchUpdateManager {
  private pendingUpdates: Map<keyof GameData, BatchUpdate> = new Map();
  private batchTimeout: NodeJS.Timeout | null = null;
  private readonly BATCH_DELAY = 1000; // 1 секунда

  addUpdate(key: keyof GameData, value: any): Promise<void> {
    return new Promise((resolve) => {
      // Добавляем или обновляем pending update
      this.pendingUpdates.set(key, {
        key,
        value,
        timestamp: Date.now()
      });

      // Очищаем предыдущий таймер
      if (this.batchTimeout) {
        clearTimeout(this.batchTimeout);
      }

      // Устанавливаем новый таймер для батч обновления
      this.batchTimeout = setTimeout(() => {
        this.processBatch().then(resolve);
      }, this.BATCH_DELAY);
    });
  }

  private async processBatch(): Promise<void> {
    if (this.pendingUpdates.size === 0) return;

    const updates: Partial<GameData> = {};
    
    // Собираем все pending updates
    for (const [key, update] of this.pendingUpdates) {
      (updates as any)[key] = update.value;
    }

    // Очищаем pending updates
    this.pendingUpdates.clear();
    this.batchTimeout = null;

    // Здесь будет вызов к Supabase для батч обновления
    console.log('Processing batch update:', updates);
    
    try {
      // Реальное обновление будет в useUnifiedGameState
      await this.sendBatchUpdate(updates);
    } catch (error) {
      console.error('Batch update failed:', error);
      throw error;
    }
  }

  private async sendBatchUpdate(updates: Partial<GameData>): Promise<void> {
    // Эта функция будет переопределена в хуке
    console.log('Sending batch update to server:', updates);
  }

  setBatchUpdateHandler(handler: (updates: Partial<GameData>) => Promise<void>) {
    this.sendBatchUpdate = handler;
  }

  // Форсировать немедленное выполнение батча
  async flushUpdates(): Promise<void> {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      await this.processBatch();
    }
  }
}

export const batchUpdateManager = new BatchUpdateManager();