
import { DiceRoll, DiceResult } from '../types/combatTypes';
import { useToast } from '@/hooks/use-toast';

export const rollDice = (): DiceRoll => {
  return Math.floor(Math.random() * 6) + 1 as DiceRoll;
};

export const getDiceResult = (roll: DiceRoll): DiceResult => {
  switch (roll) {
    case 1:
      return {
        roll,
        description: "Враг заблокировал атаку!",
        damageModifier: 0,
        isBlocked: true,
        isCounterAttack: false
      };
    case 2:
      return {
        roll,
        description: "Обычная атака",
        damageModifier: 1,
        isBlocked: false,
        isCounterAttack: false
      };
    case 3:
      return {
        roll,
        description: "Мощная атака! (+30% урона)",
        damageModifier: 1.3,
        isBlocked: false,
        isCounterAttack: false
      };
    case 4:
      return {
        roll,
        description: "Враг парировал и контратакует!",
        damageModifier: 0.5,
        isBlocked: false,
        isCounterAttack: true
      };
    case 5:
      return {
        roll,
        description: "Слабая атака (-30% урона)",
        damageModifier: 0.7,
        isBlocked: false,
        isCounterAttack: false
      };
    case 6:
      return {
        roll,
        description: "Фатальная атака! (+100% урона)",
        damageModifier: 2,
        isBlocked: false,
        isCounterAttack: false
      };
  }
};
