export interface TeamPair {
  id: string;
  hero: any;
  dragon?: any;
  health: number;
  maxHealth: number;
  power: number;
  defense: number;
  currentDefense: number;
  maxDefense: number;
  attackOrder: number;
}

export interface TeamBattleState {
  playerPairs: TeamPair[];
  opponents: any[];
  currentTurn: 'player' | 'enemy';
  currentAttacker: number; // Index of current attacker
  level: number;
  selectedDungeon: string | null;
}

export interface BattleAction {
  type: 'attack' | 'defend' | 'skip' | 'ability';
  attackerId: string;
  targetId: number;
  damage?: number;
  abilityId?: string;
}