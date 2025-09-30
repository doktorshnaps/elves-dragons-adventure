import { Opponent } from "@/types/battle";
import { getFinalEnemyStats } from "@/utils/dungeonProgression";

export const SeaSerpentLairGenerator = (level: number): Opponent[] => {
  const { stats, enemyType } = getFinalEnemyStats("sea_serpent", level);

  if (enemyType === 'boss') {
    return [{
      id: 1,
      name: "Морской Змей",
      health: stats.health,
      maxHealth: stats.health,
      power: stats.power,
      isBoss: true,
      image: "/lovable-uploads/d832d29a-6ce9-4bad-abaa-d15cb73b5382.png"
    }];
  }

  if (enemyType === 'miniboss') {
    return [{
      id: 1,
      name: "Морской Лорд",
      health: stats.health,
      maxHealth: stats.health,
      power: stats.power,
      isBoss: false,
      image: "/lovable-uploads/d832d29a-6ce9-4bad-abaa-d15cb73b5382.png"
    }];
  }

  return [
    {
      id: 1,
      name: "Морской страж",
      health: stats.health,
      maxHealth: stats.health,
      power: stats.power,
      isBoss: false,
      image: "/lovable-uploads/d832d29a-6ce9-4bad-abaa-d15cb73b5382.png"
    }
  ];
};