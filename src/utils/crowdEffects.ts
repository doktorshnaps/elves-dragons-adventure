// Модификаторы сложности толпы согласно ТЗ

/**
 * Swarm-эффект (D1-D3): +5% ATK за каждого монстра свыше 5 в волне
 */
export const calculateSwarmBonus = (
  monsterCount: number,
  dungeonLevel: number
): number => {
  // Применяется только для D1-D3
  if (dungeonLevel > 3) return 1.0;
  
  if (monsterCount <= 5) return 1.0;
  
  const extraMonsters = monsterCount - 5;
  return 1.0 + (extraMonsters * 0.05);
};

/**
 * Эффективная броня защитника при множестве врагов
 * Armor_eff = Armor / (1 + c·(N−1)); по умолчанию c=0.08
 */
export const calculateEffectiveArmor = (
  baseArmor: number,
  enemyCount: number,
  c: number = 0.08
): number => {
  if (enemyCount <= 1) return baseArmor;
  
  const divisor = 1 + c * (enemyCount - 1);
  return Math.floor(baseArmor / divisor);
};

/**
 * Штраф фокуса команды по множественным целям
 * Attack_team_eff = Attack_team / (1 + 0.07·(N−1))
 */
export const calculateFocusPenalty = (
  baseAttack: number,
  targetCount: number
): number => {
  if (targetCount <= 1) return baseAttack;
  
  const divisor = 1 + 0.07 * (targetCount - 1);
  return Math.floor(baseAttack / divisor);
};

/**
 * Применить все модификаторы толпы к статам
 */
export interface CrowdModifiers {
  effectiveArmor: number;
  effectiveAttack: number;
  swarmBonus: number;
}

export const applyCrowdModifiers = (
  baseArmor: number,
  baseAttack: number,
  allyCount: number,
  enemyCount: number,
  dungeonLevel: number,
  isPlayer: boolean
): CrowdModifiers => {
  if (isPlayer) {
    // Для игрока: уменьшается броня при множестве врагов, атака при множестве целей
    return {
      effectiveArmor: calculateEffectiveArmor(baseArmor, enemyCount),
      effectiveAttack: calculateFocusPenalty(baseAttack, enemyCount),
      swarmBonus: 1.0
    };
  } else {
    // Для врагов: swarm-бонус к атаке
    const swarmBonus = calculateSwarmBonus(allyCount, dungeonLevel);
    return {
      effectiveArmor: baseArmor,
      effectiveAttack: Math.floor(baseAttack * swarmBonus),
      swarmBonus
    };
  }
};
