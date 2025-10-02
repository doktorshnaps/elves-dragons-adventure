// Индекс мощности монстров согласно ТЗ
// S_mob(D,L) = S0 × D^α × (1 + g × L)^β

export interface PowerIndexConfig {
  S0: number;    // Базовая мощность
  alpha: number; // Степень данжа
  g: number;     // Коэффициент роста по уровням
  beta: number;  // Степень уровня
}

export const DEFAULT_POWER_CONFIG: PowerIndexConfig = {
  S0: 100,
  alpha: 1.0,
  g: 0.045,
  beta: 1.0
};

/**
 * Рассчитывает индекс мощности монстра S_mob
 * @param dungeonLevel - номер подземелья (1-8)
 * @param level - уровень внутри подземелья (1-100)
 * @param config - конфигурация формулы
 */
export const calculatePowerIndex = (
  dungeonLevel: number,
  level: number,
  config: PowerIndexConfig = DEFAULT_POWER_CONFIG
): number => {
  const { S0, alpha, g, beta } = config;
  return S0 * Math.pow(dungeonLevel, alpha) * Math.pow(1 + g * level, beta);
};

/**
 * Разложение S_mob на статы по типу монстра согласно ТЗ
 */
export interface MonsterStats {
  hp: number;
  armor: number;
  attack: number;
}

export const calculateMonsterStats = (
  smob: number,
  type: 'normal' | 'miniboss' | 'boss50' | 'boss100'
): MonsterStats => {
  switch (type) {
    case 'normal':
      // HP=0.70S, Armor=0.18S, ATK=0.18S
      return {
        hp: Math.floor(0.70 * smob),
        armor: Math.floor(0.18 * smob),
        attack: Math.floor(0.18 * smob)
      };
    
    case 'miniboss':
      // (×1.5): HP=0.85×1.5S, Armor=0.20×1.5S, ATK=0.10×1.5S
      return {
        hp: Math.floor(0.85 * 1.5 * smob),
        armor: Math.floor(0.20 * 1.5 * smob),
        attack: Math.floor(0.10 * 1.5 * smob)
      };
    
    case 'boss50':
      // (×2.5): HP=0.80×2.5S, Armor=0.22×2.5S, ATK=0.12×2.5S
      return {
        hp: Math.floor(0.80 * 2.5 * smob),
        armor: Math.floor(0.22 * 2.5 * smob),
        attack: Math.floor(0.12 * 2.5 * smob)
      };
    
    case 'boss100':
      // (×4.0): HP=0.85×4.0S, Armor=0.25×4.0S, ATK=0.10×4.0S
      return {
        hp: Math.floor(0.85 * 4.0 * smob),
        armor: Math.floor(0.25 * 4.0 * smob),
        attack: Math.floor(0.10 * 4.0 * smob)
      };
  }
};

/**
 * Получить номер подземелья по его внутреннему имени
 */
export const getDungeonNumber = (dungeonType: string): number => {
  const dungeonMap: Record<string, number> = {
    'forgotten_souls': 1,
    'spider_nest': 2,
    'bone_dungeon': 3,
    'dragon_lair': 4,
    'dark_mage': 5,
    'sea_serpent': 6,
    'ice_throne': 7,
    'pantheon_gods': 8
  };
  return dungeonMap[dungeonType] || 1;
};
