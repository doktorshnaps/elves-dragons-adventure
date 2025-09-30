import { Opponent } from "@/types/battle";
import { getFinalEnemyStats } from "@/utils/dungeonProgression";

export const DarkMageTowerGenerator = (level: number): Opponent[] => {
  const { stats, enemyType } = getFinalEnemyStats("dark_mage", level);

  if (enemyType === 'boss') {
    return [{
      id: 1,
      name: "Темный Архимаг",
      health: stats.health,
      maxHealth: stats.health,
      power: stats.power,
      isBoss: true,
      image: "/lovable-uploads/abf6e9af-a611-414c-b213-fed11ae0a767.png"
    }];
  }

  if (enemyType === 'miniboss') {
    return [{
      id: 1,
      name: "Темный Лорд",
      health: stats.health,
      maxHealth: stats.health,
      power: stats.power,
      isBoss: false,
      image: "/lovable-uploads/abf6e9af-a611-414c-b213-fed11ae0a767.png"
    }];
  }

  return [
    {
      id: 1,
      name: "Темный маг",
      health: Math.round(stats.health * 0.8),
      maxHealth: Math.round(stats.health * 0.8),
      power: Math.round(stats.power * 0.9),
      isBoss: false,
      image: "/lovable-uploads/abf6e9af-a611-414c-b213-fed11ae0a767.png"
    },
    {
      id: 2,
      name: "Черный аколит",
      health: Math.round(stats.health * 0.6),
      maxHealth: Math.round(stats.health * 0.6),
      power: Math.round(stats.power * 1.1),
      isBoss: false,
      image: "/lovable-uploads/abf6e9af-a611-414c-b213-fed11ae0a767.png"
    }
  ];
};