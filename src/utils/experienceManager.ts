import { PlayerStats, StatUpgrade } from '@/types/battle';

export const calculateRequiredExperience = (level: number): number => {
  return Math.floor(100 * Math.pow(1.5, level - 1));
};

export const getExperienceReward = (opponentLevel: number, isBoss: boolean): number => {
  const baseExperience = 20 * opponentLevel;
  return isBoss ? baseExperience * 3 : baseExperience;
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