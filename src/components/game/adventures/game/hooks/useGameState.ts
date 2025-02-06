import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Monster } from '../../types';
import { TargetedMonster } from '../types/combatTypes';

export const useGameState = (
  initialHealth: number,
  onMonsterDefeat: (monster: Monster) => void
) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentHealth, setCurrentHealth] = useState(initialHealth);
  const [isAttacking, setIsAttacking] = useState(false);
  const [targetedMonster, setTargetedMonster] = useState<TargetedMonster | null>(null);
  const [isGameOver, setIsGameOver] = useState(false);
  const [cameraOffset, setCameraOffset] = useState(0);

  useEffect(() => {
    if (currentHealth <= 0 && !isGameOver) {
      setIsGameOver(true);
      toast({
        title: "Игра окончена",
        description: "Ваш герой пал в бою",
        variant: "destructive"
      });
      
      setTimeout(() => {
        navigate('/menu');
      }, 3000);
    }
  }, [currentHealth, isGameOver, navigate, toast]);

  const handleSelectTarget = (monster: Monster) => {
    if (!monster.position) return;
    setTargetedMonster({
      id: monster.id,
      position: monster.position
    });
  };

  return {
    currentHealth,
    setCurrentHealth,
    isAttacking,
    setIsAttacking,
    targetedMonster,
    setTargetedMonster,
    isGameOver,
    cameraOffset,
    setCameraOffset,
    handleSelectTarget
  };
};