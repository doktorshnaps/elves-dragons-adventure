import { Opponent } from "@/types/battle";

export const generateSeaSerpentLairOpponents = (level: number): Opponent[] => {
  const opponents: Opponent[] = [];
  
  // Базовые характеристики противников
  const baseStats = {
    power: 20 + level * 7,
    health: 100 + level * 30,
  };

  // Добавляем глубинных охотников
  for (let i = 0; i < 2; i++) {
    opponents.push({
      id: i,
      name: "Глубинный охотник",
      power: baseStats.power,
      health: baseStats.health,
      maxHealth: baseStats.health,
      image: "/lovable-uploads/d832d29a-6ce9-4bad-abaa-d15cb73b5382.png",
      isBoss: false,
      experienceReward: 30 + level * 10
    });
  }

  // Добавляем сирену
  opponents.push({
    id: 2,
    name: "Сирена",
    power: baseStats.power * 1.4,
    health: baseStats.health * 1.4,
    maxHealth: baseStats.health * 1.4,
    image: "/lovable-uploads/d832d29a-6ce9-4bad-abaa-d15cb73b5382.png",
    isBoss: false,
    experienceReward: 50 + level * 15
  });

  // На последнем уровне добавляем босса - Морского змея
  if (level % 5 === 0) {
    opponents.push({
      id: 3,
      name: "Морской змей",
      power: baseStats.power * 2.5,
      health: baseStats.health * 3,
      maxHealth: baseStats.health * 3,
      image: "/lovable-uploads/d832d29a-6ce9-4bad-abaa-d15cb73b5382.png",
      isBoss: true,
      experienceReward: 150 + level * 25
    });
  }

  return opponents;
};