import { useState, useEffect } from "react";
import { useGameStore } from "@/stores/gameStore";

interface PlayerHealth {
  current: number;
  max: number;
}

/**
 * РЕФАКТОРИНГ: Убрано чтение из localStorage
 * Состояние здоровья берётся из Zustand battleState
 */
export const useHealthCheck = () => {
  const battleState = useGameStore((state) => state.battleState);
  
  const [playerHealth, setPlayerHealth] = useState<PlayerHealth>(() => {
    // Получаем начальное значение из Zustand
    if (battleState?.playerStats) {
      return {
        current: battleState.playerStats.health || 100,
        max: battleState.playerStats.maxHealth || 100
      };
    }
    
    // Fallback default values
    return {
      current: 100,
      max: 100
    };
  });

  // Обновляем при изменении battleState в Zustand
  useEffect(() => {
    if (battleState?.playerStats) {
      setPlayerHealth({
        current: battleState.playerStats.health || 100,
        max: battleState.playerStats.maxHealth || 100
      });
    }
  }, [battleState]);

  const isHealthTooLow = playerHealth.current < playerHealth.max * 0.2;

  return {
    playerHealth,
    isHealthTooLow
  };
};
