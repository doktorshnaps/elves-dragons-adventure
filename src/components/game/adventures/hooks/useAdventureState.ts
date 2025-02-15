
import { useState } from 'react';
import { Monster } from '../types';
import { useMonsterGeneration } from '../useMonsterGeneration';

export const useAdventureState = (playerHealth: number) => {
  const [currentHealth, setCurrentHealth] = useState(playerHealth);
  const [isAttacking, setIsAttacking] = useState(false);
  const [monsters, setMonsters] = useState<Monster[]>([]);
  const [cameraOffset, setCameraOffset] = useState(0);
  const { generateMonster } = useMonsterGeneration(1);

  return {
    currentHealth,
    setCurrentHealth,
    isAttacking,
    setIsAttacking,
    monsters,
    setMonsters,
    cameraOffset,
    setCameraOffset,
    generateMonster
  };
};
