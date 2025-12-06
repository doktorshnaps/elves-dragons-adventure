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

    const currentDefense = playerStats.currentDefense ?? playerStats.defense;
    
    // Броня уменьшается на 1 при любом уроне
    let newCurrentDefense = currentDefense;
    let damageToHealth = opponent.power;
    
    if (currentDefense > 0) {
      newCurrentDefense = currentDefense - 1;
      // Урон все равно идет в здоровье, но броня уменьшается на 1
    }

    const newStats: PlayerStats = {
      ...playerStats,
      health: Math.max(0, playerStats.health - damageToHealth),
      currentDefense: newCurrentDefense,
      maxDefense: playerStats.maxDefense ?? playerStats.defense
    };
    
    setPlayerStats(newStats);
    
    // battleState управляется через React state, не localStorage
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

    // battleState управляется через React state, не localStorage
  };

  return {
    isPlayerTurn,
    attackEnemy,
    handleOpponentAttack // Added this to the return object
  };
};