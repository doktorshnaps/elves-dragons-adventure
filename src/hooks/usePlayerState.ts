import { useState } from 'react';
import { PlayerStats } from '@/types/battle';
import { calculateTeamStats } from '@/utils/cardUtils';
import { getRequiredExperience } from '@/data/experienceTable';

export const usePlayerState = (initialStats?: PlayerStats) => {
  const [playerStats, setPlayerStats] = useState<PlayerStats>(() => {
    if (initialStats) {
      return {
        ...initialStats,
        requiredExperience: getRequiredExperience(initialStats.level)
      };
    }

    const savedCards = localStorage.getItem('gameCards');
    const cards = savedCards ? JSON.parse(savedCards) : [];
    const teamStats = calculateTeamStats(cards);

    return {
      health: teamStats.health,
      maxHealth: teamStats.health,
      power: teamStats.power,
      defense: teamStats.defense,
      experience: 0,
      level: 1,
      requiredExperience: getRequiredExperience(1)
    };
  });

  return {
    playerStats,
    setPlayerStats
  };
};