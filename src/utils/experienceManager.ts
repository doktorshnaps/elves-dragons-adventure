import { PlayerStats, StatUpgrade } from '@/types/battle';

export const calculateRequiredExperience = (level: number): number => {
  return 100 * Math.pow(2, level - 1);
};

export const getExperienceReward = (opponentLevel: number, isBoss: boolean): number => {
  if (isBoss) {
    return 200;
  }
  return 10 * Math.pow(2, opponentLevel - 1);
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