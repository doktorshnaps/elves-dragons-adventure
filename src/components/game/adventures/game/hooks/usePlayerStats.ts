
import { useState, useCallback, useEffect } from 'react';
import { calculateTeamStats } from '@/utils/cardUtils';
import { useToast } from '@/hooks/use-toast';

interface PlayerStats {
  health: number;
  maxHealth: number;
  power: number;
  defense: number;
  armor: number;
  maxArmor: number;
  level: number;
  experience: number;
  requiredExperience: number;
}

export const usePlayerStats = (initialLevel = 1) => {
  const { toast } = useToast();
  
  const calculateEquipmentBonuses = useCallback(() => {
    const inventory = localStorage.getItem('gameInventory');
    if (!inventory) return { power: 0, defense: 0, health: 0 };

    const equippedItems = JSON.parse(inventory).filter((item: any) => item.equipped);
    return equippedItems.reduce((acc: any, item: any) => ({
      power: acc.power + (item.stats?.power || 0),
      defense: acc.defense + (item.stats?.defense || 0),
      health: acc.health + (item.stats?.health || 0)
    }), { power: 0, defense: 0, health: 0 });
  }, []);

  const calculateBaseStats = useCallback((level: number) => {
    const savedCards = localStorage.getItem('gameCards');
    const cards = savedCards ? JSON.parse(savedCards) : [];
    const teamStats = calculateTeamStats(cards);

    return {
      power: teamStats.power + (level - 1),
      defense: teamStats.defense + (level - 1),
      health: teamStats.health + (level - 1) * 10
    };
  }, []);

  const [stats, setStats] = useState<PlayerStats>(() => {
    const baseStats = calculateBaseStats(initialLevel);
    const equipmentBonuses = calculateEquipmentBonuses();
    
    return {
      health: baseStats.health + equipmentBonuses.health,
      maxHealth: baseStats.health + equipmentBonuses.health,
      power: baseStats.power + equipmentBonuses.power,
      defense: baseStats.defense + equipmentBonuses.defense,
      armor: 50,
      maxArmor: 50,
      level: initialLevel,
      experience: 0,
      requiredExperience: 100
    };
  });

  // Обработчик события воскрешения
  useEffect(() => {
    const handleRespawn = () => {
      setStats(prev => ({
        ...prev,
        health: prev.maxHealth,
        armor: prev.maxArmor
      }));
    };

    window.addEventListener('playerRespawn', handleRespawn);
    return () => window.removeEventListener('playerRespawn', handleRespawn);
  }, []);

  const updateStats = useCallback((updater: (prev: PlayerStats) => PlayerStats) => {
    setStats(prev => {
      const newStats = updater(prev);
      return newStats;
    });
  }, []);

  const addExperience = useCallback((amount: number) => {
    setStats(prev => {
      const newExperience = prev.experience + amount;
      let newLevel = prev.level;
      let remainingExp = newExperience;
      let nextRequiredExp = prev.requiredExperience;

      // Проверяем, достаточно ли опыта для повышения уровня
      while (remainingExp >= nextRequiredExp) {
        newLevel++;
        remainingExp -= nextRequiredExp;
        nextRequiredExp = Math.floor(nextRequiredExp * 1.5); // Увеличиваем требуемый опыт для следующего уровня

        // Увеличиваем характеристики при повышении уровня
        toast({
          title: "Уровень повышен!",
          description: `Достигнут ${newLevel} уровень!`
        });
      }

      // Обновляем базовые характеристики с учетом нового уровня
      const baseStats = calculateBaseStats(newLevel);
      const equipmentBonuses = calculateEquipmentBonuses();

      return {
        ...prev,
        level: newLevel,
        experience: remainingExp,
        requiredExperience: nextRequiredExp,
        health: baseStats.health + equipmentBonuses.health,
        maxHealth: baseStats.health + equipmentBonuses.health,
        power: baseStats.power + equipmentBonuses.power,
        defense: baseStats.defense + equipmentBonuses.defense
      };
    });
  }, [calculateBaseStats, calculateEquipmentBonuses, toast]);

  return {
    stats,
    updateStats,
    addExperience
  };
};
