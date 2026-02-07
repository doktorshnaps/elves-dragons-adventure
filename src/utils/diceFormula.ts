/**
 * Unified dice formula for all game modes (Adventure + PvP).
 * D6 roll determines damage multiplier applied to attacker's power.
 *
 * Roll 1: 0% damage — Counterattack (opponent strikes back)
 * Roll 2: 0% damage — Miss
 * Roll 3: 50% damage — Weak hit
 * Roll 4: 100% damage — Normal hit
 * Roll 5: 150% damage — Strong hit
 * Roll 6: 200% damage — Critical hit
 */

export const getDiceMultiplier = (roll: number): number => {
  switch (roll) {
    case 1: return 0;
    case 2: return 0;
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
  return roll <= 2;
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
      return { text: "Промах!", color: "text-orange-400" };
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
  if (isMiss(roll)) return 0;
  const multiplier = getDiceMultiplier(roll);
  const rawDamage = Math.floor(attackerPower * multiplier);
  return Math.max(1, rawDamage - defenderDefense);
};
