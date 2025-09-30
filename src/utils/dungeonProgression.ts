// Система прогрессии подземелий
export interface DungeonStats {
  health: number;
  power: number;
  defense: number;
}

// Базовые статы для первого подземелья (уровень 1)
const BASE_STATS: DungeonStats = {
  health: 100,
  power: 20, 
  defense: 25
};

// Множители для каждого подземелья (каждый следующий в 3 раза сильнее)
const DUNGEON_MULTIPLIERS: Record<string, number> = {
  spider_nest: 1,      // Подземелье 1 (самое легкое)
  dragon_lair: 3,      // Подземелье 2
  forgotten_souls: 9,  // Подземелье 3
  ice_throne: 27,      // Подземелье 4
  dark_mage: 81,       // Подземелье 5
  bone_dungeon: 243,   // Подземелье 6
  sea_serpent: 729,    // Подземелье 7
  pantheon_gods: 2187  // Подземелье 8 (самое сложное)
};

/**
 * Рассчитывает статы врага по формуле:
 * Стат врага = базовый_стат × (уровень/10 + 1) × множитель_подземелья
 */
export const calculateEnemyStats = (dungeonType: string, level: number): DungeonStats => {
  const levelMultiplier = (level / 10) + 1;
  const dungeonMultiplier = DUNGEON_MULTIPLIERS[dungeonType] || 1;
  
  return {
    health: Math.round(BASE_STATS.health * levelMultiplier * dungeonMultiplier),
    power: Math.round(BASE_STATS.power * levelMultiplier * dungeonMultiplier),
    defense: Math.round(BASE_STATS.defense * levelMultiplier * dungeonMultiplier)
  };
};

/**
 * Определяет тип врага на основе уровня
 */
export const getEnemyType = (level: number): 'normal' | 'miniboss' | 'boss' => {
  if (level === 100 || level === 50) {
    return 'boss'; // ×6 сила
  }
  if (level % 10 === 0) {
    return 'miniboss'; // ×3 сила
  }
  return 'normal'; // обычная сила
};

/**
 * Применяет множители для разных типов врагов
 */
export const applyEnemyTypeMultiplier = (stats: DungeonStats, enemyType: 'normal' | 'miniboss' | 'boss'): DungeonStats => {
  let multiplier = 1;
  
  switch (enemyType) {
    case 'miniboss':
      multiplier = 3;
      break;
    case 'boss':
      multiplier = 6;
      break;
    default:
      multiplier = 1;
  }
  
  return {
    health: Math.round(stats.health * multiplier),
    power: Math.round(stats.power * multiplier),
    defense: Math.round(stats.defense * multiplier)
  };
};

/**
 * Главная функция для получения финальных статов врага
 */
export const getFinalEnemyStats = (dungeonType: string, level: number): { stats: DungeonStats; enemyType: 'normal' | 'miniboss' | 'boss' } => {
  const baseStats = calculateEnemyStats(dungeonType, level);
  const enemyType = getEnemyType(level);
  const finalStats = applyEnemyTypeMultiplier(baseStats, enemyType);
  
  return { stats: finalStats, enemyType };
};