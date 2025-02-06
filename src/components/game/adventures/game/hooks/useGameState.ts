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

  useEffect(() => {
    if (initialHealth > 0) {
      setCurrentHealth(initialHealth);
      setIsGameOver(false);
    }
  }, [initialHealth]);

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
      }, 2000);
    }
  }, [currentHealth, isGameOver, navigate, toast]);

  const handleSelectTarget = (monster: Monster) => {
    console.log("Selecting target:", monster);
    if (monster.position === undefined) return;
    
    setTargetedMonster({
      id: monster.id,
      position: monster.position
    });
    
    toast({
      title: "Цель выбрана",
      description: `${monster.name} выбран целью для атаки`
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
    handleSelectTarget
  };
};