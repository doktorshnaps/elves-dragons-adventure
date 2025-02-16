
export interface Monster {
  id: number;
  name: string;
  health: number;
  maxHealth: number;
  power: number;
  position: number;
  type: 'normal' | 'elite' | 'boss';
  experienceReward: number;
  reward: number;
}

export interface Equipment {
  weapon?: any;
  armor?: any;
  accessory?: any;
}

export interface PlayerStats {
  power: number;
  defense: number;
  maxHealth: number;
}
