import { Opponent } from "@/types/battle";
import { getScaledStats } from "@/utils/opponentGenerator";
import { getExperienceReward } from "@/utils/experienceManager";

export const generateForgottenSoulsCaveOpponents = (level: number): Opponent[] => {
  const cycleLevel = ((level - 1) % 5) + 1;
  
  if (cycleLevel === 5) {
    const health = getScaledStats(200, level, true);
    return [{
      id: 1,
      name: "👻 Призрачный лорд",
      power: getScaledStats(13, level, true),
      health,
      maxHealth: health,
      isBoss: true,
      experienceReward: getExperienceReward(level, true)
    }];
  }

  const opponents: Opponent[] = [];
  const enemyCount = 6 - cycleLevel;

  // Потерянная душа
  if (cycleLevel <= 2) {
    const health = getScaledStats(100, level);
    opponents.push({
      id: opponents.length + 1,
      name: "Потерянная душа",
      power: getScaledStats(7, level),
      health,
      maxHealth: health,
      experienceReward: getExperienceReward(level, false)
    });
  }

  // Призрачный воин
  const mediumCount = Math.floor((enemyCount - opponents.length) / 2);
  for (let i = 0; i < mediumCount; i++) {
    const health = getScaledStats(70, level);
    opponents.push({
      id: opponents.length + 1,
      name: "Призрачный воин",
      power: getScaledStats(4, level),
      health,
      maxHealth: health,
      experienceReward: getExperienceReward(level, false)
    });
  }

  // Скелет-воин
  const remainingCount = enemyCount - opponents.length;
  for (let i = 0; i < remainingCount; i++) {
    const health = getScaledStats(40, level);
    opponents.push({
      id: opponents.length + 1,
      name: "Скелет-воин",
      power: getScaledStats(3, level),
      health,
      maxHealth: health,
      experienceReward: getExperienceReward(level, false)
    });
  }

  return opponents;
};