import { Opponent } from "@/types/battle";

export const PantheonOfGodsGenerator = (level: number): Opponent[] => {
  const baseHealth = 110 + (level - 1) * 55;
  const basePower = 11 + (level - 1) * 5.5;

  if (level % 5 === 0) {
    return [{
      id: 1,
      name: "Верховный Бог",
      health: baseHealth * 2,
      maxHealth: baseHealth * 2,
      power: basePower * 1.5,
      isBoss: true,
      image: "/lovable-uploads/pantheon-of-gods.png"
    }];
  }

  return [
    {
      id: 1,
      name: "Божественный страж",
      health: baseHealth,
      maxHealth: baseHealth,
      power: basePower,
      isBoss: false,
      image: "/lovable-uploads/pantheon-of-gods.png"
    }
  ];
};
