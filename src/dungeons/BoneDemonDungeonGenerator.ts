import { Opponent } from "@/types/battle";

export const BoneDemonDungeonGenerator = (level: number): Opponent[] => {
  const baseHealth = 85 + (level - 1) * 42.5;
  const basePower = 8.5 + (level - 1) * 4.25;
  const baseExperience = level * 85;

  if (level % 5 === 0) {
    return [{
      id: 1,
      name: "Костяной Демон",
      health: baseHealth * 2,
      maxHealth: baseHealth * 2,
      power: basePower * 1.5,
      isBoss: true,
      experienceReward: baseExperience * 2,
      image: "/lovable-uploads/aef9e591-e676-4552-a70d-c7457b29b6c5.png"
    }];
  }

  return [
    {
      id: 1,
      name: "Скелет-воин",
      health: baseHealth,
      maxHealth: baseHealth,
      power: basePower,
      isBoss: false,
      experienceReward: baseExperience,
      image: "/lovable-uploads/aef9e591-e676-4552-a70d-c7457b29b6c5.png"
    }
  ];
};