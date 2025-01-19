import { Opponent } from "@/types/battle";

export const generateBoneDemonDungeonOpponents = (level: number): Opponent[] => {
  const opponents: Opponent[] = [];
  
  // Базовые характеристики противников
  const baseStats = {
    power: 18 + level * 6,
    health: 90 + level * 25,
  };

  // Добавляем скелетов-магов
  for (let i = 0; i < 2; i++) {
    opponents.push({
      id: i,
      name: "Скелет-маг",
      power: baseStats.power,
      health: baseStats.health,
      maxHealth: baseStats.health,
      image: "/lovable-uploads/aef9e591-e676-4552-a70d-c7457b29b6c5.png",
      isBoss: false
    });
  }

  // Добавляем демона-стража
  opponents.push({
    id: 2,
    name: "Демон-страж",
    power: baseStats.power * 1.3,
    health: baseStats.health * 1.3,
    maxHealth: baseStats.health * 1.3,
    image: "/lovable-uploads/aef9e591-e676-4552-a70d-c7457b29b6c5.png",
    isBoss: false
  });

  // На последнем уровне добавляем босса - Костяного демона
  if (level % 5 === 0) {
    opponents.push({
      id: 3,
      name: "Костяной демон",
      power: baseStats.power * 2.2,
      health: baseStats.health * 2.8,
      maxHealth: baseStats.health * 2.8,
      image: "/lovable-uploads/aef9e591-e676-4552-a70d-c7457b29b6c5.png",
      isBoss: true
    });
  }

  return opponents;
};