import { useState } from "react";

interface PlayerHealth {
  current: number;
  max: number;
}

export const useHealthCheck = () => {
  const [playerHealth, setPlayerHealth] = useState<PlayerHealth>(() => {
    const savedState = localStorage.getItem('battleState');
    if (savedState) {
      const state = JSON.parse(savedState);
      return {
        current: state.playerStats.health,
        max: state.playerStats.maxHealth
      };
    }
    return { current: 100, max: 100 };
  });

  const isHealthTooLow = playerHealth.current < playerHealth.max * 0.2;

  return {
    playerHealth,
    isHealthTooLow
  };
};