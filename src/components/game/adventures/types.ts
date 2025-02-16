
export interface Monster {
  id: number;
  name: string;
  power: number;
  health: number;
  maxHealth: number;
  reward: number;
  experienceReward: number;
  type: "normal" | "elite" | "boss";
  position: number;
}
