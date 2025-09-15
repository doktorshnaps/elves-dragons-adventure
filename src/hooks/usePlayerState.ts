import { useState } from 'react';
import { PlayerStats } from '@/types/battle';
import { calculateTeamStats } from '@/utils/cardUtils';

export const usePlayerState = (initialStats?: PlayerStats) => {
  const [playerStats, setPlayerStats] = useState<PlayerStats>(() => {
    if (initialStats) {
      return {
        ...initialStats
      };
    }

    const savedCards = localStorage.getItem('gameCards');
    const cards = savedCards ? JSON.parse(savedCards) : [];
    const teamStats = calculateTeamStats(cards);

    return {
      health: teamStats.health,
      maxHealth: teamStats.maxHealth,
      power: teamStats.power,
      defense: teamStats.defense
    };
  });

  return {
    playerStats,
    setPlayerStats
  };
};