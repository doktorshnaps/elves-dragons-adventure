import { Opponent } from "@/types/battle";

export const BlackDragonLairGenerator = (level: number): Opponent[] => {
  const baseHealth = 100 + (level - 1) * 50;
  const basePower = 10 + (level - 1) * 5;

  if (level % 5 === 0) {
    // Босс каждые 5 уровней
    return [{
      id: 1,
      name: "Черный Дракон",
      health: baseHealth * 2,
      maxHealth: baseHealth * 2,
      power: basePower * 1.5,
      isBoss: true,
      image: "/lovable-uploads/7b2107b3-2cc1-440f-bb39-43a98c2a1e1a.png"
    }];
  }

  // Обычные противники
  return [
    {
      id: 1,
      name: "Драконид",
      health: baseHealth,
      maxHealth: baseHealth,
      power: basePower,
      isBoss: false,
      image: "/lovable-uploads/7b2107b3-2cc1-440f-bb39-43a98c2a1e1a.png"
    },
    {
      id: 2,
      name: "Драконий страж",
      health: baseHealth * 0.8,
      maxHealth: baseHealth * 0.8,
      power: basePower * 1.2,
      isBoss: false,
      image: "/lovable-uploads/7b2107b3-2cc1-440f-bb39-43a98c2a1e1a.png"
    }
  ];
};