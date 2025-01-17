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

  const attackEnemy = (enemyId: number) => {
    const battleState = localStorage.getItem('battleState');
    if (!battleState) return;

    if (!isPlayerTurn || !playerStats) return;

    const newOpponents = opponents.map(opponent => {
      if (opponent.id === enemyId) {
        const { damage, isCritical } = calculateDamage(playerStats.power);
        const newHealth = opponent.health - (damage || 0);
        
        toast({
          title: opponent.isBoss ? 
            (isCritical ? "🎯 Критический удар по боссу!" : "⚔️ Атака босса!") :
            (isCritical ? "Критическая атака!" : "Атака!"),
          description: `Вы нанесли ${isCritical ? "критические " : ""}${damage ? damage.toFixed(0) : "0"} урона ${opponent.name}!`,
          variant: isCritical ? "destructive" : "default",
          duration: 1000
        });
        
        if (newHealth <= 0) {
          handleOpponentDefeat(opponent);
          return null;
        }
        
        return { ...opponent, health: newHealth };
      }
      return opponent;
    }).filter(Boolean) as Opponent[];

    setOpponents(newOpponents);
    setIsPlayerTurn(false);

    // Сохраняем состояние после хода игрока
    const state = JSON.parse(battleState);
    state.opponents = newOpponents;
    localStorage.setItem('battleState', JSON.stringify(state));
  };

  const handleOpponentAttack = () => {
    const battleState = localStorage.getItem('battleState');
    if (!battleState) return;

    if (!playerStats || opponents.length === 0 || isPlayerTurn) return;

    const randomOpponent = opponents[Math.floor(Math.random() * opponents.length)];
    const { blockedDamage, damageToHealth, newDefense } = calculatePlayerDamage(
      randomOpponent.power,
      playerStats.defense
    );

    const newStats: PlayerStats = {
      ...playerStats,
      health: Math.max(0, playerStats.health - damageToHealth),
      defense: newDefense
    };
    
    setPlayerStats(newStats);
    
    let message = `${randomOpponent.name} атакует с силой ${randomOpponent.power}!`;
    if (blockedDamage > 0) {
      message += ` Защита блокирует ${blockedDamage.toFixed(0)} урона.`;
    }
    if (damageToHealth > 0) {
      message += ` Нанесено ${damageToHealth.toFixed(0)} урона здоровью!`;
    }
    message += ` Защита уменьшилась на ${(playerStats.defense - newDefense).toFixed(0)}.`;
    
    toast({
      title: randomOpponent.isBoss ? "⚠️ Атака босса!" : "Враг атакует!",
      description: message,
      variant: randomOpponent.isBoss ? "destructive" : "default",
      duration: 1000
    });

    setIsPlayerTurn(true);

    // Сохраняем состояние после хода противника
    const state = JSON.parse(battleState);
    state.playerStats = newStats;
    localStorage.setItem('battleState', JSON.stringify(state));
  };

  return {
    isPlayerTurn,
    attackEnemy,
    handleOpponentAttack,
  };
};