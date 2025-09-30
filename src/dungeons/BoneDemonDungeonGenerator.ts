import { Opponent } from "@/types/battle";
import { getFinalEnemyStats } from "@/utils/dungeonProgression";

export const BoneDemonDungeonGenerator = (level: number): Opponent[] => {
  const { stats, enemyType } = getFinalEnemyStats("bone_dungeon", level);

  if (enemyType === 'boss') {
    return [{
      id: 1,
      name: "Костяной Демон",
      health: stats.health,
      maxHealth: stats.health,
      power: stats.power,
      isBoss: true,
      image: "/lovable-uploads/aef9e591-e676-4552-a70d-c7457b29b6c5.png"
    }];
  }

  if (enemyType === 'miniboss') {
    return [{
      id: 1,
      name: "Костяной Лорд",
      health: stats.health,
      maxHealth: stats.health,
      power: stats.power,
      isBoss: false,
      image: "/lovable-uploads/aef9e591-e676-4552-a70d-c7457b29b6c5.png"
    }];
  }

  return [
    {
      id: 1,
      name: "Скелет-воин",
      health: stats.health,
      maxHealth: stats.health,
      power: stats.power,
      isBoss: false,
      image: "/lovable-uploads/aef9e591-e676-4552-a70d-c7457b29b6c5.png"
    }
  ];
};