
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
  const [isRespawning, setIsRespawning] = useState(false);

  // Сбрасываем состояние при инициализации
  useEffect(() => {
    setCurrentHealth(initialHealth);
    setIsGameOver(false);
    setIsRespawning(false);
  }, [initialHealth]);

  // Обработка события воскрешения
  useEffect(() => {
    const handleRespawn = () => {
      setCurrentHealth(initialHealth);
      setIsGameOver(false);
      setIsRespawning(false);
      toast({
        title: "Герой возродился",
        description: "Продолжайте приключение"
      });
    };

    window.addEventListener('playerRespawn', handleRespawn);
    return () => window.removeEventListener('playerRespawn', handleRespawn);
  }, [initialHealth, toast]);

  // Обработка смерти персонажа
  useEffect(() => {
    if (currentHealth <= 0 && !isGameOver && !isRespawning) {
      setIsGameOver(true);
      setIsRespawning(true);
      
      toast({
        title: "Герой пал в бою",
        description: "Возрождение через 3 секунды...",
        duration: 2000,
        variant: "destructive"
      });
      
      // Запускаем процесс возрождения
      setTimeout(() => {
        const event = new CustomEvent('playerRespawn');
        window.dispatchEvent(event);
      }, 3000);
    }
  }, [currentHealth, isGameOver, isRespawning, navigate, toast]);

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
    isRespawning,
    handleSelectTarget
  };
};
