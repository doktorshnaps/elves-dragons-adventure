import { useState, useMemo } from 'react';
import { PlayerStats } from '@/types/battle';
import { calculateTeamStats } from '@/utils/cardUtils';
import { useGameStore } from '@/stores/gameStore';

/**
 * РЕФАКТОРИНГ: Убрано чтение из localStorage
 * Теперь используем selectedTeam из gameStore для расчёта статистики игрока
 */
export const usePlayerState = (initialStats?: PlayerStats) => {
  const selectedTeam = useGameStore((state) => state.selectedTeam);
  
  // Вычисляем статистику команды из selectedTeam
  const teamStats = useMemo(() => {
    if (!selectedTeam || selectedTeam.length === 0) {
      return { health: 100, maxHealth: 100, power: 10, defense: 5 };
    }
    
    // Извлекаем карты героев из пар команды
    const teamCards = selectedTeam
      .map(pair => pair?.hero)
      .filter(Boolean);
    
    if (teamCards.length === 0) {
      return { health: 100, maxHealth: 100, power: 10, defense: 5 };
    }
    
    return calculateTeamStats(teamCards);
  }, [selectedTeam]);
  
  const [playerStats, setPlayerStats] = useState<PlayerStats>(() => {
    if (initialStats) {
      return { ...initialStats };
    }

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
