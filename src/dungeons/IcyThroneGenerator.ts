import { Opponent } from "@/types/battle";
import { getFinalEnemyStats } from "@/utils/dungeonProgression";

export const IcyThroneGenerator = (level: number): Opponent[] => {
  const { stats, enemyType } = getFinalEnemyStats("ice_throne", level);

  if (enemyType === 'boss') {
    return [{
      id: 1,
      name: "Ледяной Король",
      health: stats.health,
      maxHealth: stats.health,
      power: stats.power,
      isBoss: true,
      image: "/lovable-uploads/301f4f03-6a87-48ec-a535-535b2213026f.png"
    }];
  }

  if (enemyType === 'miniboss') {
    return [{
      id: 1,
      name: "Ледяной Лорд",
      health: stats.health,
      maxHealth: stats.health,
      power: stats.power,
      isBoss: false,
      image: "/lovable-uploads/301f4f03-6a87-48ec-a535-535b2213026f.png"
    }];
  }

  return [
    {
      id: 1,
      name: "Ледяной воин",
      health: Math.round(stats.health * 0.8),
      maxHealth: Math.round(stats.health * 0.8),
      power: Math.round(stats.power * 0.9),
      isBoss: false,
      image: "/lovable-uploads/301f4f03-6a87-48ec-a535-535b2213026f.png"
    },
    {
      id: 2,
      name: "Ледяной страж",
      health: Math.round(stats.health * 0.6),
      maxHealth: Math.round(stats.health * 0.6),
      power: Math.round(stats.power * 1.1),
      isBoss: false,
      image: "/lovable-uploads/301f4f03-6a87-48ec-a535-535b2213026f.png"
    }
  ];
};