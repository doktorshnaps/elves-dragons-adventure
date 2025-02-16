
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
        title: "Вы погибли",
        description: "Возрождение через 2 секунды...",
        variant: "destructive"
      });
      
      // Через 2 секунды воскрешаем персонажа
      setTimeout(() => {
        setIsGameOver(false);
        setCurrentHealth(initialHealth);
        // Создаем событие воскрешения
        const respawnEvent = new Event('playerRespawn');
        window.dispatchEvent(respawnEvent);
        
        toast({
          title: "Возрождение",
          description: "Здоровье восстановлено"
        });
      }, 2000);
    }
  }, [currentHealth, isGameOver, navigate, toast, initialHealth]);

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
