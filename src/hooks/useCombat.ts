import { useState } from 'react';
import { PlayerStats, Opponent } from '@/types/battle';
import { calculateDamage, calculatePlayerDamage } from '@/utils/battleCalculations';
import { useToast } from '@/hooks/use-toast';

export const useCombat = (
  playerStats: PlayerStats,
  setPlayerStats: (stats: PlayerStats) => void,
  opponents: Opponent[],
  setOpponents: (opponents: Opponent[]) => void,
  handleOpponentDefeat: (opponent: Opponent) => void
) => {
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const { toast } = useToast();

  const handleOpponentAttack = (opponent: Opponent) => {
    if (!playerStats) return;

    const { blockedDamage, damageToHealth, newDefense } = calculatePlayerDamage(
      opponent.power,
      playerStats.defense
    );

    const newStats: PlayerStats = {
      ...playerStats,
      health: Math.max(0, playerStats.health - damageToHealth),
      defense: newDefense
    };
    
    setPlayerStats(newStats);
    
    // Убрано системное уведомление во время боя

    const battleState = localStorage.getItem('battleState');
    if (battleState) {
      const state = JSON.parse(battleState);
      state.playerStats = newStats;
      localStorage.setItem('battleState', JSON.stringify(state));
    }
  };

  const attackEnemy = (enemyId: number) => {
    if (!isPlayerTurn || !playerStats) return;

    const newOpponents = opponents.map(opponent => {
      if (opponent.id === enemyId) {
        const { damage, isCritical } = calculateDamage(playerStats.power);
        const newHealth = opponent.health - (damage || 0);
        
        // Убрано системное уведомление во время боя
        
        if (newHealth <= 0) {
          handleOpponentDefeat(opponent);
          return null;
        }
        
        return { ...opponent, health: newHealth };
      }
      return opponent;
    }).filter(Boolean) as Opponent[];

    setOpponents(newOpponents);

    // Автоматическая контратака врага
    if (newOpponents.length > 0) {
      const randomOpponent = newOpponents[Math.floor(Math.random() * newOpponents.length)];
      handleOpponentAttack(randomOpponent);
    }

    const battleState = localStorage.getItem('battleState');
    if (battleState) {
      const state = JSON.parse(battleState);
      state.opponents = newOpponents;
      localStorage.setItem('battleState', JSON.stringify(state));
    }
  };

  return {
    isPlayerTurn,
    attackEnemy,
    handleOpponentAttack // Added this to the return object
  };
};