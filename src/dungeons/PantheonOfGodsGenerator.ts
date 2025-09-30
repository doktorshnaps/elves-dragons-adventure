import { Opponent } from "@/types/battle";
import { getFinalEnemyStats } from "@/utils/dungeonProgression";

export const PantheonOfGodsGenerator = (level: number): Opponent[] => {
  const { stats, enemyType } = getFinalEnemyStats("pantheon_gods", level);

  if (enemyType === 'boss') {
    return [{
      id: 1,
      name: "Верховный Бог",
      health: stats.health,
      maxHealth: stats.health,
      power: stats.power,
      isBoss: true,
      image: "/lovable-uploads/pantheon-of-gods.png"
    }];
  }

  if (enemyType === 'miniboss') {
    return [{
      id: 1,
      name: "Божественный Лорд",
      health: stats.health,
      maxHealth: stats.health,
      power: stats.power,
      isBoss: false,
      image: "/lovable-uploads/pantheon-of-gods.png"
    }];
  }

  return [
    {
      id: 1,
      name: "Божественный страж",
      health: Math.round(stats.health * 0.8),
      maxHealth: Math.round(stats.health * 0.8),
      power: Math.round(stats.power * 0.9),
      isBoss: false,
      image: "/lovable-uploads/pantheon-of-gods.png"
    },
    {
      id: 2,
      name: "Небесный паладин",
      health: Math.round(stats.health * 0.6),
      maxHealth: Math.round(stats.health * 0.6),
      power: Math.round(stats.power * 1.1),
      isBoss: false,
      image: "/lovable-uploads/pantheon-of-gods.png"
    }
  ];
};
