import { Opponent } from "@/types/battle";
import { getScaledStats } from "@/utils/opponentGenerator";
import { getExperienceReward } from "@/utils/experienceManager";

export const generateBlackDragonLairOpponents = (level: number): Opponent[] => {
  const cycleLevel = ((level - 1) % 5) + 1;
  
  if (cycleLevel === 5) {
    const health = getScaledStats(250, level, true);
    return [{
      id: 1,
      name: "🔥 Черный дракон",
      power: getScaledStats(15, level, true),
      health,
      maxHealth: health,
      isBoss: true,
      experienceReward: getExperienceReward(level, true)
    }];
  }

  const opponents: Opponent[] = [];
  const enemyCount = 6 - cycleLevel;

  // Драконий страж
  if (cycleLevel <= 2) {
    const health = getScaledStats(120, level);
    opponents.push({
      id: opponents.length + 1,
      name: "Драконий страж",
      power: getScaledStats(8, level),
      health,
      maxHealth: health,
      experienceReward: getExperienceReward(level, false)
    });
  }

  // Драконид
  const mediumCount = Math.floor((enemyCount - opponents.length) / 2);
  for (let i = 0; i < mediumCount; i++) {
    const health = getScaledStats(80, level);
    opponents.push({
      id: opponents.length + 1,
      name: "Драконид",
      power: getScaledStats(5, level),
      health,
      maxHealth: health,
      experienceReward: getExperienceReward(level, false)
    });
  }

  // Драконий прислужник
  const remainingCount = enemyCount - opponents.length;
  for (let i = 0; i < remainingCount; i++) {
    const health = getScaledStats(50, level);
    opponents.push({
      id: opponents.length + 1,
      name: "Драконий прислужник",
      power: getScaledStats(3, level),
      health,
      maxHealth: health,
      experienceReward: getExperienceReward(level, false)
    });
  }

  return opponents;
};