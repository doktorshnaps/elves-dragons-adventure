/**
 * Unified dice formula for all game modes (Adventure + PvP).
 * D6 roll determines damage multiplier applied to attacker's power.
 *
 * Roll 1: 0% damage — Counterattack (opponent strikes back)
 * Roll 2: 25% damage — Glancing blow
 * Roll 3: 50% damage — Weak hit
 * Roll 4: 100% damage — Normal hit
 * Roll 5: 150% damage — Strong hit
 * Roll 6: 200% damage — Critical hit
 *
 * Pity system: after 2 consecutive low rolls (1-2), next roll guarantees minimum 50% damage.
 */

/**
 * Per-session pity tracker. Create one per combat session to avoid
 * cross-session contamination from the old global counter.
 */
export interface PityTracker {
  counter: number;
}

export const createPityTracker = (): PityTracker => ({ counter: 0 });

// Legacy global tracker — kept for backward compat but prefer createPityTracker
let globalPityCounter = 0;

export const resetPityCounter = (): void => {
  globalPityCounter = 0;
};

export const getPityCounter = (): number => globalPityCounter;

export const getDiceMultiplier = (roll: number, pity?: PityTracker): number => {
  const counter = pity ? pity.counter : globalPityCounter;

  // Pity system: after 2 consecutive low rolls, guarantee minimum 50%
  if (counter >= 2 && roll <= 2) {
    if (pity) pity.counter = 0; else globalPityCounter = 0;
    return 0.5; // Guaranteed weak hit instead of miss
  }

  // Track consecutive low rolls
  if (roll <= 2) {
    if (pity) pity.counter++; else globalPityCounter++;
  } else {
    if (pity) pity.counter = 0; else globalPityCounter = 0;
  }

  switch (roll) {
    case 1: return 0;
    case 2: return 0.25;
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
  return roll === 1;
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
  defenderDefense: number = 0,
  pity?: PityTracker
): number => {
  const multiplier = getDiceMultiplier(roll, pity);
  if (multiplier === 0) return 0;
  const rawDamage = Math.floor(attackerPower * multiplier);
  return Math.max(1, rawDamage - defenderDefense);
};
