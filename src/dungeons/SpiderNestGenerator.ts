import { Opponent } from "@/types/battle";

export const generateSpiderNestOpponents = (level: number): Opponent[] => {
  const opponents: Opponent[] = [];
  
  // Базовые характеристики противников
  const baseStats = {
    power: 15 + level * 5,
    health: 80 + level * 20,
  };

  // Добавляем обычных пауков
  for (let i = 0; i < 2; i++) {
    opponents.push({
      id: i,
      name: "Паук-охотник",
      power: baseStats.power,
      health: baseStats.health,
      maxHealth: baseStats.health,
      image: "/lovable-uploads/ebf85dda-c79b-4350-80c2-65fde21b31ad.png",
      isBoss: false
    });
  }

  // Добавляем паука-ткача
  opponents.push({
    id: 2,
    name: "Паук-ткач",
    power: baseStats.power * 1.2,
    health: baseStats.health * 1.2,
    maxHealth: baseStats.health * 1.2,
    image: "/lovable-uploads/ebf85dda-c79b-4350-80c2-65fde21b31ad.png",
    isBoss: false
  });

  // На последнем уровне добавляем босса - Королеву пауков
  if (level % 5 === 0) {
    opponents.push({
      id: 3,
      name: "Королева пауков",
      power: baseStats.power * 2,
      health: baseStats.health * 2.5,
      maxHealth: baseStats.health * 2.5,
      image: "/lovable-uploads/ebf85dda-c79b-4350-80c2-65fde21b31ad.png",
      isBoss: true
    });
  }

  return opponents;
};