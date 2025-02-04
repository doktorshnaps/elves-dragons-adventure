import { Opponent } from "@/types/battle";

export const DarkMageTowerGenerator = (level: number): Opponent[] => {
  const baseHealth = 70 + (level - 1) * 35;
  const basePower = 12 + (level - 1) * 6;
  const baseExperience = level * 90;

  if (level % 5 === 0) {
    return [{
      id: 1,
      name: "Темный Архимаг",
      health: baseHealth * 2,
      maxHealth: baseHealth * 2,
      power: basePower * 1.5,
      isBoss: true,
      experienceReward: baseExperience * 2,
      image: "/lovable-uploads/abf6e9af-a611-414c-b213-fed11ae0a767.png"
    }];
  }

  return [
    {
      id: 1,
      name: "Темный маг",
      health: baseHealth,
      maxHealth: baseHealth,
      power: basePower,
      isBoss: false,
      experienceReward: baseExperience,
      image: "/lovable-uploads/abf6e9af-a611-414c-b213-fed11ae0a767.png"
    }
  ];
};