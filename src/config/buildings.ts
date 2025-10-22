// Конфигурация зданий для добычи ресурсов
import { supabase } from '@/integrations/supabase/client';

export interface ResourceBuildingConfig {
  level: number;
  productionPerHour: number;
  upgradeCosts: {
    wood: number;
    stone: number;
    iron?: number;
    gold?: number;
    ell?: number;
    gt?: number;
  };
}

// Кэш для конфигураций из базы данных
let configsCache: Map<string, any[]> | null = null;
let cachePromise: Promise<void> | null = null;

// Загрузка конфигураций из базы данных
const loadConfigsFromDB = async (): Promise<Map<string, any[]>> => {
  if (configsCache) return configsCache;
  
  if (cachePromise) {
    await cachePromise;
    return configsCache || new Map();
  }

  cachePromise = (async () => {
    try {
      const { data, error } = await supabase
        .from('building_configs')
        .select('*')
        .eq('is_active', true)
        .order('level', { ascending: true });

      if (error) throw error;

      const grouped = new Map<string, any[]>();
      data?.forEach(config => {
        const existing = grouped.get(config.building_id) || [];
        grouped.set(config.building_id, [...existing, config]);
      });

      configsCache = grouped;
    } catch (error) {
      console.error('Error loading building configs from DB:', error);
      configsCache = new Map();
    }
  })();

  await cachePromise;
  return configsCache || new Map();
};

// Конфигурация склада - определяет время работы производства
export const WAREHOUSE_CONFIG = [
  { level: 1, workingHours: 1 },
  { level: 2, workingHours: 2 },
  { level: 3, workingHours: 4 },
  { level: 4, workingHours: 6 },
  { level: 5, workingHours: 12 },
  { level: 6, workingHours: 18 },
  { level: 7, workingHours: 24 },
  { level: 8, workingHours: 48 },
];

export const getWarehouseWorkingHours = (level: number): number => {
  if (configsCache) {
    const configs = configsCache.get('storage');
    const dbConfig = configs?.find(c => c.level === level);
    if (dbConfig && dbConfig.working_hours > 0) {
      return dbConfig.working_hours;
    }
  }
  const config = WAREHOUSE_CONFIG.find(config => config.level === level);
  return config ? config.workingHours : 1;
};

// Конфигурация лесопилки (fallback)
export const SAWMILL_CONFIG: ResourceBuildingConfig[] = [
  { level: 1, productionPerHour: 60, upgradeCosts: { wood: 0, stone: 0 } },
  { level: 2, productionPerHour: 81, upgradeCosts: { wood: 2200, stone: 990 } },
  { level: 3, productionPerHour: 109, upgradeCosts: { wood: 3960, stone: 1782 } },
  { level: 4, productionPerHour: 147, upgradeCosts: { wood: 7128, stone: 3207 } },
  { level: 5, productionPerHour: 198, upgradeCosts: { wood: 12830, stone: 5773 } },
  { level: 6, productionPerHour: 267, upgradeCosts: { wood: 23094, stone: 10392 } },
  { level: 7, productionPerHour: 360, upgradeCosts: { wood: 41570, stone: 18706 } },
  { level: 8, productionPerHour: 486, upgradeCosts: { wood: 74826, stone: 33671 } },
];

// Конфигурация каменоломни (fallback)
export const QUARRY_CONFIG: ResourceBuildingConfig[] = [
  { level: 1, productionPerHour: 30, upgradeCosts: { wood: 0, stone: 0 } },
  { level: 2, productionPerHour: 39, upgradeCosts: { wood: 562, stone: 1250 } },
  { level: 3, productionPerHour: 51, upgradeCosts: { wood: 1012, stone: 2250 } },
  { level: 4, productionPerHour: 67, upgradeCosts: { wood: 1822, stone: 4050 } },
  { level: 5, productionPerHour: 89, upgradeCosts: { wood: 3280, stone: 7290 } },
  { level: 6, productionPerHour: 118, upgradeCosts: { wood: 5904, stone: 13122 } },
  { level: 7, productionPerHour: 156, upgradeCosts: { wood: 10628, stone: 23619 } },
  { level: 8, productionPerHour: 207, upgradeCosts: { wood: 19131, stone: 42515 } },
];

// Функции для получения конфигурации зданий (с приоритетом базы данных)
export const getSawmillConfig = (level: number): ResourceBuildingConfig | null => {
  if (configsCache) {
    const configs = configsCache.get('sawmill');
    const dbConfig = configs?.find(c => c.level === level);
    if (dbConfig) {
      return {
        level: dbConfig.level,
        productionPerHour: dbConfig.production_per_hour,
        upgradeCosts: {
          wood: dbConfig.cost_wood,
          stone: dbConfig.cost_stone,
          iron: dbConfig.cost_iron,
          gold: dbConfig.cost_gold,
          ell: dbConfig.cost_ell,
          gt: dbConfig.cost_gt,
        }
      };
    }
  }
  return SAWMILL_CONFIG.find(config => config.level === level) || null;
};

export const getQuarryConfig = (level: number): ResourceBuildingConfig | null => {
  if (configsCache) {
    const configs = configsCache.get('quarry');
    const dbConfig = configs?.find(c => c.level === level);
    if (dbConfig) {
      return {
        level: dbConfig.level,
        productionPerHour: dbConfig.production_per_hour,
        upgradeCosts: {
          wood: dbConfig.cost_wood,
          stone: dbConfig.cost_stone,
          iron: dbConfig.cost_iron,
          gold: dbConfig.cost_gold,
          ell: dbConfig.cost_ell,
          gt: dbConfig.cost_gt,
        }
      };
    }
  }
  return QUARRY_CONFIG.find(config => config.level === level) || null;
};

// Функции для получения стоимости улучшения
export const getSawmillUpgradeCost = (currentLevel: number) => {
  const nextLevelConfig = getSawmillConfig(currentLevel + 1);
  return nextLevelConfig ? nextLevelConfig.upgradeCosts : null;
};

export const getQuarryUpgradeCost = (currentLevel: number) => {
  const nextLevelConfig = getQuarryConfig(currentLevel + 1);
  return nextLevelConfig ? nextLevelConfig.upgradeCosts : null;
};

// Функции для получения производительности
export const getSawmillProduction = (level: number): number => {
  const config = getSawmillConfig(level);
  return config ? config.productionPerHour : 0;
};

export const getQuarryProduction = (level: number): number => {
  const config = getQuarryConfig(level);
  return config ? config.productionPerHour : 0;
};

// Инициализация кэша при импорте модуля
loadConfigsFromDB().catch(console.error);

// Функция для принудительного обновления кэша
export const refreshBuildingConfigs = async () => {
  configsCache = null;
  cachePromise = null;
  await loadConfigsFromDB();
};
