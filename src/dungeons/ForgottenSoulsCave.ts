import { Opponent } from "@/types/battle";
import { getFinalEnemyStats } from "@/utils/dungeonProgression";

export const ForgottenSoulsCaveGenerator = (level: number): Opponent[] => {
  const { stats, enemyType } = getFinalEnemyStats("forgotten_souls", level);

  if (enemyType === 'boss') {
    return [{
      id: 1,
      name: "Король Призраков",
      health: stats.health,
      maxHealth: stats.health,
      power: stats.power,
      isBoss: true,
      image: "/lovable-uploads/3445a1d0-8e5a-4785-bcce-f3b88bbd6f14.png"
    }];
  }

  if (enemyType === 'miniboss') {
    return [{
      id: 1,
      name: "Призрачный Лорд",
      health: stats.health,
      maxHealth: stats.health,
      power: stats.power,
      isBoss: false,
      image: "/lovable-uploads/3445a1d0-8e5a-4785-bcce-f3b88bbd6f14.png"
    }];
  }

  return [
    {
      id: 1,
      name: "Потерянная душа",
      health: stats.health,
      maxHealth: stats.health,
      power: stats.power,
      isBoss: false,
      image: "/lovable-uploads/3445a1d0-8e5a-4785-bcce-f3b88bbd6f14.png"
    }
  ];
};