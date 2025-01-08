import { PlayerStats, StatUpgrade } from '@/types/battle';

export const calculateRequiredExperience = (level: number): number => {
  return 100 * Math.pow(2, level - 1);
};

export const getExperienceReward = (level: number, isBoss: boolean): number => {
  if (isBoss) {
    return 300; // Босс всегда дает 300 опыта
  }
  // Базовая награда 20 опыта на первом уровне
  // На каждом следующем уровне на 30% больше
  const baseReward = 20;
  return Math.floor(baseReward * Math.pow(1.3, level - 1));
};

export const getLevelCompletionReward = (isBoss: boolean): number => {
  return isBoss ? 300 : 100; // 300 монет за босса, 100 за обычный уровень
};

export const checkLevelUp = (stats: PlayerStats): boolean => {
  return stats.experience >= stats.requiredExperience;
};

export const upgradeStats = (stats: PlayerStats, upgrade: StatUpgrade): PlayerStats => {
  const newStats = { ...stats };
  
  switch (upgrade) {
    case 'health':
      newStats.maxHealth += 20;
      newStats.health = newStats.maxHealth;
      break;
    case 'power':
      newStats.power += 5;
      break;
    case 'defense':
      newStats.defense += 3;
      break;
  }
  
  newStats.level += 1;
  newStats.experience -= newStats.requiredExperience;
  newStats.requiredExperience = calculateRequiredExperience(newStats.level);
  
  return newStats;
};