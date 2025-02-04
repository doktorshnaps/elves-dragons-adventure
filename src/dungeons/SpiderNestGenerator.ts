import { Opponent } from "@/types/battle";

export const SpiderNestGenerator = (level: number): Opponent[] => {
  const baseHealth = 60 + (level - 1) * 30;
  const basePower = 7 + (level - 1) * 3.5;

  if (level % 5 === 0) {
    return [{
      id: 1,
      name: "Королева пауков",
      health: baseHealth * 2,
      maxHealth: baseHealth * 2,
      power: basePower * 1.5,
      isBoss: true,
      image: "/lovable-uploads/ebf85dda-c79b-4350-80c2-65fde21b31ad.png"
    }];
  }

  return [
    {
      id: 1,
      name: "Гигантский паук",
      health: baseHealth,
      maxHealth: baseHealth,
      power: basePower,
      isBoss: false,
      image: "/lovable-uploads/ebf85dda-c79b-4350-80c2-65fde21b31ad.png"
    }
  ];
};