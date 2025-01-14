import { Opponent } from "@/types/battle";
import { getScaledStats } from "@/utils/opponentGenerator";
import { getExperienceReward } from "@/utils/experienceManager";

export const generateIcyThroneOpponents = (level: number): Opponent[] => {
  const cycleLevel = ((level - 1) % 5) + 1;
  
  if (cycleLevel === 5) {
    const health = getScaledStats(220, level, true);
    return [{
      id: 1,
      name: "❄️ Ледяной Король",
      power: getScaledStats(14, level, true),
      health,
      maxHealth: health,
      isBoss: true,
      experienceReward: getExperienceReward(level, true)
    }];
  }

  const opponents: Opponent[] = [];
  const enemyCount = 6 - cycleLevel;

  // Ледяной голем
  if (cycleLevel <= 2) {
    const health = getScaledStats(110, level);
    opponents.push({
      id: opponents.length + 1,
      name: "Ледяной голем",
      power: getScaledStats(7, level),
      health,
      maxHealth: health,
      experienceReward: getExperienceReward(level, false)
    });
  }

  // Снежный элементаль
  const mediumCount = Math.floor((enemyCount - opponents.length) / 2);
  for (let i = 0; i < mediumCount; i++) {
    const health = getScaledStats(75, level);
    opponents.push({
      id: opponents.length + 1,
      name: "Снежный элементаль",
      power: getScaledStats(5, level),
      health,
      maxHealth: health,
      experienceReward: getExperienceReward(level, false)
    });
  }

  // Ледяной воин
  const remainingCount = enemyCount - opponents.length;
  for (let i = 0; i < remainingCount; i++) {
    const health = getScaledStats(45, level);
    opponents.push({
      id: opponents.length + 1,
      name: "Ледяной воин",
      power: getScaledStats(3, level),
      health,
      maxHealth: health,
      experienceReward: getExperienceReward(level, false)
    });
  }

  return opponents;
};