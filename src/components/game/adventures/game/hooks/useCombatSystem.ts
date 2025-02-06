import { useState } from 'react';
import { Monster } from '../../types';
import { calculateAttackResult } from '../../combat/combatUtils';
import { useToast } from '@/hooks/use-toast';

export const useCombatSystem = (
  playerPower: number,
  currentHealth: number,
  setCurrentHealth: (health: number) => void,
  monsters: Monster[],
  setMonsters: React.Dispatch<React.SetStateAction<Monster[]>>,
  onMonsterDefeat: (monster: Monster) => void
) => {
  const [selectedMonster, setSelectedMonster] = useState<Monster | null>(null);
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const { toast } = useToast();

  const handleMonsterSelect = (monster: Monster) => {
    setSelectedMonster(monster);
    toast({
      title: "Цель выбрана",
      description: `${monster.name} выбран как цель для атаки`,
    });
  };

  const handleAttack = () => {
    if (!selectedMonster) {
      toast({
        title: "Выберите цель",
        description: "Сначала выберите монстра для атаки",
        variant: "destructive"
      });
      return;
    }

    if (!isPlayerTurn) {
      toast({
        title: "Подождите",
        description: "Сейчас ход противника",
        variant: "destructive"
      });
      return;
    }

    const result = calculateAttackResult(playerPower);
    
    if (result.damage >= 0) {
      const updatedMonster = {
        ...selectedMonster,
        health: Math.max(0, selectedMonster.health - result.damage)
      };

      toast({
        title: result.message,
        description: `Нанесено ${result.damage} урона`,
        variant: result.type === 'fatal' || result.type === 'critical' ? "destructive" : "default"
      });

      if (updatedMonster.health <= 0) {
        setMonsters(prev => prev.filter(m => m.id !== selectedMonster.id));
        setSelectedMonster(null);
        onMonsterDefeat(updatedMonster);
        setIsPlayerTurn(true);
      } else {
        setMonsters(prev => 
          prev.map(m => m.id === selectedMonster.id ? updatedMonster : m)
        );
        setIsPlayerTurn(false);
        
        setTimeout(() => {
          const monsterResult = calculateAttackResult(updatedMonster.power);
          if (monsterResult.damage >= 0) {
            // Fix: Calculate new health value first, then pass it to setCurrentHealth
            const newHealth = Math.max(0, currentHealth - monsterResult.damage);
            setCurrentHealth(newHealth);
            
            toast({
              title: `${updatedMonster.name} атакует!`,
              description: `${monsterResult.message} Получено ${monsterResult.damage} урона!`,
              variant: monsterResult.type === 'fatal' || monsterResult.type === 'critical' ? "destructive" : "default"
            });
          } else {
            toast({
              title: monsterResult.message,
              description: "Монстр промахнулся!",
            });
          }
          setIsPlayerTurn(true);
        }, 1000);
      }
    } else {
      const playerDamage = Math.abs(result.damage);
      // Fix: Calculate new health value first, then pass it to setCurrentHealth
      const newHealth = Math.max(0, currentHealth - playerDamage);
      setCurrentHealth(newHealth);
      
      toast({
        title: result.message,
        description: `Получено ${playerDamage} урона`,
        variant: "destructive"
      });
      
      setIsPlayerTurn(false);
      setTimeout(() => setIsPlayerTurn(true), 1000);
    }
  };

  return {
    selectedMonster,
    isPlayerTurn,
    handleMonsterSelect,
    handleAttack
  };
};