import { useState, useEffect } from 'react';
import { Monster } from '../../types';
import { TargetedMonster } from '../types/combatTypes';

export const useGameState = (
  initialHealth: number,
  onMonsterDefeat: (monster: Monster) => void
) => {
  const [currentHealth, setCurrentHealth] = useState(initialHealth);
  const [isAttacking, setIsAttacking] = useState(false);
  const [targetedMonster, setTargetedMonster] = useState<TargetedMonster | null>(null);

  useEffect(() => {
    if (initialHealth > 0) {
      setCurrentHealth(initialHealth);
    }
  }, [initialHealth]);

  return {
    currentHealth,
    setCurrentHealth,
    isAttacking,
    setIsAttacking,
    targetedMonster,
    setTargetedMonster
  };
};