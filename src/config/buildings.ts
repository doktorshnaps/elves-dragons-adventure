// Конфигурация зданий для добычи ресурсов

export interface ResourceBuildingConfig {
  level: number;
  productionPerHour: number;
  upgradeCosts: {
    wood: number;
    stone: number;
  };
}

// Конфигурация лесопилки
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

// Конфигурация каменоломни
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

// Функции для получения конфигурации зданий
export const getSawmillConfig = (level: number): ResourceBuildingConfig | null => {
  return SAWMILL_CONFIG.find(config => config.level === level) || null;
};

export const getQuarryConfig = (level: number): ResourceBuildingConfig | null => {
  return QUARRY_CONFIG.find(config => config.level === level) || null;
};

// Функции для получения стоимости улучшения
export const getSawmillUpgradeCost = (currentLevel: number) => {
  const nextLevelConfig = SAWMILL_CONFIG.find(config => config.level === currentLevel + 1);
  return nextLevelConfig ? nextLevelConfig.upgradeCosts : null;
};

export const getQuarryUpgradeCost = (currentLevel: number) => {
  const nextLevelConfig = QUARRY_CONFIG.find(config => config.level === currentLevel + 1);
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