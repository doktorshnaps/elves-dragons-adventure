import { Opponent } from "@/types/battle";

export const ForgottenSoulsCaveGenerator = (level: number): Opponent[] => {
  const baseHealth = 80 + (level - 1) * 40;
  const basePower = 8 + (level - 1) * 4;
  const baseExperience = level * 80;

  if (level % 5 === 0) {
    return [{
      id: 1,
      name: "Король Призраков",
      health: baseHealth * 2,
      maxHealth: baseHealth * 2,
      power: basePower * 1.5,
      isBoss: true,
      experienceReward: baseExperience * 2,
      image: "/lovable-uploads/3445a1d0-8e5a-4785-bcce-f3b88bbd6f14.png"
    }];
  }

  return [
    {
      id: 1,
      name: "Потерянная душа",
      health: baseHealth,
      maxHealth: baseHealth,
      power: basePower,
      isBoss: false,
      experienceReward: baseExperience,
      image: "/lovable-uploads/3445a1d0-8e5a-4785-bcce-f3b88bbd6f14.png"
    }
  ];
};