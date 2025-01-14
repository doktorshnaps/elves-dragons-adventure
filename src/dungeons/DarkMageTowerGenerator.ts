import { Opponent } from "@/types/battle";
import { getScaledStats } from "@/utils/opponentGenerator";

export const generateDarkMageTowerOpponents = (level: number): Opponent[] => {
  const cycleLevel = ((level - 1) % 5) + 1;
  
  if (cycleLevel === 5) {
    const health = getScaledStats(180, level, true);
    return [{
      id: 1,
      name: "🔮 Темный маг",
      power: getScaledStats(16, level, true),
      health,
      maxHealth: health,
      isBoss: true
    }];
  }

  const opponents: Opponent[] = [];
  const enemyCount = 6 - cycleLevel;

  if (cycleLevel <= 2) {
    const health = getScaledStats(90, level);
    opponents.push({
      id: opponents.length + 1,
      name: "Чернокнижник",
      power: getScaledStats(9, level),
      health,
      maxHealth: health
    });
  }

  const mediumCount = Math.floor((enemyCount - opponents.length) / 2);
  for (let i = 0; i < mediumCount; i++) {
    const health = getScaledStats(60, level);
    opponents.push({
      id: opponents.length + 1,
      name: "Темный ученик",
      power: getScaledStats(6, level),
      health,
      maxHealth: health
    });
  }

  const remainingCount = enemyCount - opponents.length;
  for (let i = 0; i < remainingCount; i++) {
    const health = getScaledStats(40, level);
    opponents.push({
      id: opponents.length + 1,
      name: "Магический голем",
      power: getScaledStats(4, level),
      health,
      maxHealth: health
    });
  }

  return opponents;
};