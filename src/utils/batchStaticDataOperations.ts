import { queryClient } from '@/config/reactQuery';

/**
 * Batch operations для статических данных с selective invalidation
 */
export class BatchStaticDataOperations {
  private pendingInvalidations = new Set<string>();
  private invalidationTimer: NodeJS.Timeout | null = null;
  private readonly DEBOUNCE_DELAY = 300; // ms

  /**
   * Добавить тип данных для инвалидации
   */
  scheduleInvalidation(dataType: keyof typeof STATIC_DATA_KEYS) {
    this.pendingInvalidations.add(dataType);
    
    // Debounce invalidation
    if (this.invalidationTimer) {
      clearTimeout(this.invalidationTimer);
    }
    
    this.invalidationTimer = setTimeout(() => {
      this.flushInvalidations();
    }, this.DEBOUNCE_DELAY);
  }

  /**
   * Немедленно выполнить все pending инвалидации
   */
  async flushInvalidations(): Promise<void> {
    if (this.pendingInvalidations.size === 0) return;

    console.log('🔄 [BatchStaticData] Flushing selective invalidations:', 
      Array.from(this.pendingInvalidations)
    );

    const invalidationPromises = Array.from(this.pendingInvalidations).map(dataType => {
      const queryKey = STATIC_DATA_KEYS[dataType as keyof typeof STATIC_DATA_KEYS];
      return queryClient.invalidateQueries({ 
        queryKey,
        exact: true // Только точное совпадение, не инвалидируем дочерние ключи
      });
    });

    await Promise.all(invalidationPromises);
    
    this.pendingInvalidations.clear();
    this.invalidationTimer = null;

    console.log('✅ [BatchStaticData] Selective invalidation complete');
  }

  /**
   * Инвалидировать только конкретные типы данных
   */
  async invalidateSpecific(dataTypes: Array<keyof typeof STATIC_DATA_KEYS>): Promise<void> {
    console.log('🎯 [BatchStaticData] Selective invalidation:', dataTypes);

    const invalidationPromises = dataTypes.map(dataType => {
      const queryKey = STATIC_DATA_KEYS[dataType];
      return queryClient.invalidateQueries({ 
        queryKey,
        exact: true 
      });
    });

    await Promise.all(invalidationPromises);
    console.log('✅ [BatchStaticData] Specific invalidation complete');
  }

  /**
   * Предзагрузить только определенные типы статических данных
   */
  async prefetchSpecific(dataTypes: Array<keyof typeof STATIC_DATA_KEYS>): Promise<void> {
    console.log('⚡ [BatchStaticData] Prefetching specific data:', dataTypes);

    // Предзагружаем только запрошенные типы данных
    const prefetchPromises = dataTypes.map(async (dataType) => {
      const queryKey = STATIC_DATA_KEYS[dataType];
      
      // Проверяем, есть ли уже данные в кэше
      const cachedData = queryClient.getQueryData(queryKey);
      if (cachedData) {
        console.log(`✅ [BatchStaticData] ${dataType} already in cache`);
        return;
      }

      // Если нет в кэше, делаем prefetch
      return queryClient.prefetchQuery({
        queryKey,
        staleTime: 1000 * 60 * 60, // 1 час
      });
    });

    await Promise.all(prefetchPromises);
    console.log('✅ [BatchStaticData] Prefetch complete');
  }
}

/**
 * Query keys для статических данных
 */
export const STATIC_DATA_KEYS = {
  all: ['staticGameData', 'v2'],
  buildingConfigs: ['staticGameData', 'v2', 'building_configs'],
  craftingRecipes: ['staticGameData', 'v2', 'crafting_recipes'],
  itemTemplates: ['staticGameData', 'v2', 'item_templates'],
  cardDropRates: ['staticGameData', 'v2', 'card_drop_rates'],
  cardUpgradeRequirements: ['staticGameData', 'v2', 'card_upgrade_requirements'],
  monsters: ['staticGameData', 'v2', 'monsters'],
  dungeonSettings: ['staticGameData', 'v2', 'dungeon_settings'],
} as const;

// Singleton instance
export const batchStaticDataOps = new BatchStaticDataOperations();
