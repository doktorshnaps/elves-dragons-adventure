import { useCallback, useMemo, useRef } from 'react';

// Дебаунс для частых операций
export const useDebounce = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const timeoutRef = useRef<NodeJS.Timeout>();

  return useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]) as T;
};

// Мемоизация для тяжелых вычислений
export const useMemoizedTeamStats = (cards: any[], selectedTeam: any[]) => {
  return useMemo(() => {
    let totalPower = 0;
    let totalDefense = 0;
    let totalHealth = 0;

    selectedTeam.forEach((pair: any) => {
      if (pair.hero) {
        totalPower += pair.hero.power;
        totalDefense += pair.hero.defense;
        totalHealth += pair.hero.health;
      }
      if (pair.dragon && pair.dragon.faction === pair.hero?.faction) {
        totalPower += pair.dragon.power;
        totalDefense += pair.dragon.defense;
        totalHealth += pair.dragon.health;
      }
    });

    return {
      power: totalPower,
      defense: totalDefense,
      health: totalHealth,
      maxHealth: totalHealth
    };
  }, [cards, selectedTeam]);
};

// Оптимизация изображений
export const preloadImage = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
};

export const preloadImages = async (urls: string[]): Promise<void> => {
  const promises = urls.map(preloadImage);
  await Promise.allSettled(promises);
};