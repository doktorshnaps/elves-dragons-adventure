import { Opponent } from "@/types/battle";

export const IcyThroneGenerator = (level: number): Opponent[] => {
  const baseHealth = 90 + (level - 1) * 45;
  const basePower = 9 + (level - 1) * 4.5;

  if (level % 5 === 0) {
    return [{
      id: 1,
      name: "Ледяной Король",
      health: baseHealth * 2,
      maxHealth: baseHealth * 2,
      power: basePower * 1.5,
      isBoss: true,
      image: "/lovable-uploads/301f4f03-6a87-48ec-a535-535b2213026f.png"
    }];
  }

  return [
    {
      id: 1,
      name: "Ледяной воин",
      health: baseHealth,
      maxHealth: baseHealth,
      power: basePower,
      isBoss: false,
      image: "/lovable-uploads/301f4f03-6a87-48ec-a535-535b2213026f.png"
    }
  ];
};