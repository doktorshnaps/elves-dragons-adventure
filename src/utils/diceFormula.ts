/**
 * Unified dice formula for all game modes (Adventure + PvP).
 * D6 roll determines damage multiplier applied to attacker's power.
 *
 * Roll 1: 0% damage — Counterattack (opponent strikes back)
 * Roll 2: 25% damage — Glancing blow (was 0% miss, reduced frustration)
 * Roll 3: 50% damage — Weak hit
 * Roll 4: 100% damage — Normal hit
 * Roll 5: 150% damage — Strong hit
 * Roll 6: 200% damage — Critical hit
 *
 * Pity system: after 2 consecutive low rolls (1-2), next roll guarantees minimum 50% damage.
 */

// Pity counter — tracks consecutive low rolls per combat session
let pityCounter = 0;

export const resetPityCounter = (): void => {
  pityCounter = 0;
};

export const getPityCounter = (): number => pityCounter;

export const getDiceMultiplier = (roll: number): number => {
  // Pity system: after 2 consecutive low rolls, guarantee minimum 50%
  if (pityCounter >= 2 && roll <= 2) {
    pityCounter = 0;
    return 0.5; // Guaranteed weak hit instead of miss
  }

  // Track consecutive low rolls
  if (roll <= 2) {
    pityCounter++;
  } else {
    pityCounter = 0;
  }

  switch (roll) {
    case 1: return 0;
    case 2: return 0.25; // Glancing blow (was 0% miss)
    case 3: return 0.5;
    case 4: return 1;
    case 5: return 1.5;
    case 6: return 2;
    default: return 0;
  }
};

export const getDicePercentage = (roll: number): number => {
  return getDiceMultiplier(roll) * 100;
};

export const isMiss = (roll: number): boolean => {
  return roll === 1; // Only roll 1 is a true miss now (counterattack)
};

export const isCounterAttack = (roll: number): boolean => {
  return roll === 1;
};

export const isCriticalHit = (roll: number): boolean => {
  return roll === 6;
};

export interface DiceDescription {
  text: string;
  color: string;
}

export const getDiceDescription = (roll: number): DiceDescription => {
  switch (roll) {
    case 1:
      return { text: "Критический промах! Контратака!", color: "text-red-500" };
    case 2:
      return { text: "Скользящий удар (25%)", color: "text-orange-400" };
    case 3:
      return { text: "Слабый удар (50%)", color: "text-yellow-400" };
    case 4:
      return { text: "Нормальный удар (100%)", color: "text-green-400" };
    case 5:
      return { text: "Сильный удар (150%)", color: "text-blue-400" };
    case 6:
      return { text: "Критический удар! (200%)", color: "text-purple-400" };
    default:
      return { text: "", color: "text-white" };
  }
};

/**
 * Calculate damage dealt based on dice roll, attacker power, and defender defense.
 */
export const calculateDiceDamage = (
  roll: number,
  attackerPower: number,
  defenderDefense: number = 0
): number => {
  const multiplier = getDiceMultiplier(roll);
  if (multiplier === 0) return 0;
  const rawDamage = Math.floor(attackerPower * multiplier);
  return Math.max(1, rawDamage - defenderDefense);
};
