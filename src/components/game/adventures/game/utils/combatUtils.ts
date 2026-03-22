/**
 * Combat utilities for Adventure mode.
 * Now delegates to the unified diceFormula.ts to keep all modes consistent.
 */
import { DiceRoll, DiceResult } from '../types/combatTypes';
import { getDiceMultiplier, isCounterAttack as checkCounterAttack } from '@/utils/diceFormula';

export const rollDice = (): DiceRoll => {
  return Math.floor(Math.random() * 6) + 1 as DiceRoll;
};

export const getDiceResult = (roll: DiceRoll): DiceResult => {
  const multiplier = getDiceMultiplier(roll);
  const counterAttack = checkCounterAttack(roll);
  const isBlocked = roll === 1;

  const descriptions: Record<DiceRoll, string> = {
    1: "Критический промах! Контратака!",
    2: "Скользящий удар (25% урона)",
    3: "Слабый удар (50% урона)",
    4: "Нормальный удар (100% урона)",
    5: "Сильный удар (150% урона)",
    6: "Критический удар! (200% урона)",
  };

  return {
    roll,
    description: descriptions[roll],
    damageModifier: multiplier,
    isBlocked,
    isCounterAttack: counterAttack,
  };
};
