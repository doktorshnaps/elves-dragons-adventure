import { Opponent } from "@/types/battle";

export const SeaSerpentLairGenerator = (level: number): Opponent[] => {
  const baseHealth = 95 + (level - 1) * 47.5;
  const basePower = 9.5 + (level - 1) * 4.75;
  const baseExperience = level * 98;

  if (level % 5 === 0) {
    return [{
      id: 1,
      name: "Морской Змей",
      health: baseHealth * 2,
      maxHealth: baseHealth * 2,
      power: basePower * 1.5,
      isBoss: true,
      experienceReward: baseExperience * 2,
      image: "/lovable-uploads/d832d29a-6ce9-4bad-abaa-d15cb73b5382.png"
    }];
  }

  return [
    {
      id: 1,
      name: "Морской страж",
      health: baseHealth,
      maxHealth: baseHealth,
      power: basePower,
      isBoss: false,
      experienceReward: baseExperience,
      image: "/lovable-uploads/d832d29a-6ce9-4bad-abaa-d15cb73b5382.png"
    }
  ];
};