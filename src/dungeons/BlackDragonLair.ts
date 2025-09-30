import { Opponent } from "@/types/battle";
import { getFinalEnemyStats } from "@/utils/dungeonProgression";

export const BlackDragonLairGenerator = (level: number): Opponent[] => {
  const { stats, enemyType } = getFinalEnemyStats("dragon_lair", level);

  if (enemyType === 'boss') {
    return [{
      id: 1,
      name: "Черный Дракон",
      health: stats.health,
      maxHealth: stats.health,
      power: stats.power,
      isBoss: true,
      image: "/lovable-uploads/7b2107b3-2cc1-440f-bb39-43a98c2a1e1a.png"
    }];
  }

  if (enemyType === 'miniboss') {
    return [{
      id: 1,
      name: "Драконий Лорд",
      health: stats.health,
      maxHealth: stats.health,
      power: stats.power,
      isBoss: false,
      image: "/lovable-uploads/7b2107b3-2cc1-440f-bb39-43a98c2a1e1a.png"
    }];
  }

  return [
    {
      id: 1,
      name: "Драконид",
      health: Math.round(stats.health * 0.8),
      maxHealth: Math.round(stats.health * 0.8),
      power: Math.round(stats.power * 0.9),
      isBoss: false,
      image: "/lovable-uploads/7b2107b3-2cc1-440f-bb39-43a98c2a1e1a.png"
    },
    {
      id: 2,
      name: "Драконий страж",
      health: Math.round(stats.health * 0.6),
      maxHealth: Math.round(stats.health * 0.6),
      power: Math.round(stats.power * 1.1),
      isBoss: false,
      image: "/lovable-uploads/7b2107b3-2cc1-440f-bb39-43a98c2a1e1a.png"
    }
  ];
};