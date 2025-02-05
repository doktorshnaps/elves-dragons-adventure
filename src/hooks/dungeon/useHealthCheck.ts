import { useState } from "react";

export const useHealthCheck = () => {
  const [playerHealth, setPlayerHealth] = useState<PlayerHealth>(() => {
    const savedState = localStorage.getItem('battleState');
    if (savedState) {
      try {
        const state = JSON.parse(savedState);
        if (state && state.playerStats) {
          return {
            current: state.playerStats.health,
            max: state.playerStats.maxHealth
          };
        }
      } catch (e) {
        console.error('Error parsing battleState:', e);
      }
    }
    
    // Default values if no valid state exists
    const savedCards = localStorage.getItem('gameCards');
    if (savedCards) {
      try {
        const cards = JSON.parse(savedCards);
        const totalHealth = cards.reduce((sum: number, card: any) => sum + (card.health || 0), 0);
        return {
          current: totalHealth,
          max: totalHealth
        };
      } catch (e) {
        console.error('Error parsing gameCards:', e);
      }
    }
    
    // Fallback default values
    return {
      current: 100,
      max: 100
    };
  });

  const isHealthTooLow = playerHealth.current < playerHealth.max * 0.2;

  return {
    playerHealth,
    isHealthTooLow
  };
};

interface PlayerHealth {
  current: number;
  max: number;
}