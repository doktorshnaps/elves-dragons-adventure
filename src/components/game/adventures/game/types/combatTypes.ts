
export type DiceRoll = 1 | 2 | 3 | 4 | 5 | 6;

export interface DiceResult {
  roll: DiceRoll;
  description: string;
  damageModifier: number;
  isBlocked: boolean;
  isCounterAttack: boolean;
}

export interface Monster {
  id: number;
  name: string;
  health: number;
  maxHealth: number;
  power: number;
  position?: number;
  type: 'normal' | 'elite' | 'boss';
  experienceReward: number;
}

export interface TargetedMonster {
  id: number;
  position: number;
}

