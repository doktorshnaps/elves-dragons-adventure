
import { useState, useCallback, useEffect, useMemo } from 'react';
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
    const savedStats = localStorage.getItem('adventurePlayerStats');
    if (savedStats) {
      const parsed = JSON.parse(savedStats);
      const baseStats = calculateBaseStats(parsed.level);
      const equipmentBonuses = calculateEquipmentBonuses();
      
      return {
        ...parsed,
        power: baseStats.power + equipmentBonuses.power,
        defense: baseStats.defense + equipmentBonuses.defense,
        maxHealth: baseStats.health + equipmentBonuses.health,
        health: Math.min(parsed.health, baseStats.health + equipmentBonuses.health)
      };
    }

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

  const updateStats = useCallback((updater: (prev: PlayerStats) => PlayerStats) => {
    setStats(prev => {
      const newStats = updater(prev);
      localStorage.setItem('adventurePlayerStats', JSON.stringify(newStats));
      return newStats;
    });
  }, []);

  useEffect(() => {
    const handleInventoryUpdate = () => {
      const equipmentBonuses = calculateEquipmentBonuses();
      const baseStats = calculateBaseStats(stats.level);
      
      updateStats(prev => ({
        ...prev,
        power: baseStats.power + equipmentBonuses.power,
        defense: baseStats.defense + equipmentBonuses.defense,
        maxHealth: baseStats.health + equipmentBonuses.health,
        health: Math.min(prev.health, baseStats.health + equipmentBonuses.health)
      }));
    };

    window.addEventListener('inventoryUpdate', handleInventoryUpdate);
    return () => window.removeEventListener('inventoryUpdate', handleInventoryUpdate);
  }, [stats.level, calculateBaseStats, calculateEquipmentBonuses, updateStats]);

  const addExperience = useCallback((amount: number) => {
    updateStats(prev => {
      const newExperience = prev.experience + amount;
      
      if (newExperience >= prev.requiredExperience) {
        const newLevel = prev.level + 1;
        const newRequiredExp = prev.requiredExperience + 100;
        const baseStats = calculateBaseStats(newLevel);
        const equipmentBonuses = calculateEquipmentBonuses();

        toast({
          title: "Уровень повышен!",
          description: `Достигнут ${newLevel} уровень!`
        });
        
        return {
          ...prev,
          level: newLevel,
          experience: newExperience - prev.requiredExperience,
          requiredExperience: newRequiredExp,
          power: baseStats.power + equipmentBonuses.power,
          defense: baseStats.defense + equipmentBonuses.defense,
          maxHealth: baseStats.health + equipmentBonuses.health,
          health: baseStats.health + equipmentBonuses.health
        };
      }

      return {
        ...prev,
        experience: newExperience
      };
    });
  }, [calculateBaseStats, calculateEquipmentBonuses, toast, updateStats]);

  return {
    stats,
    updateStats,
    addExperience
  };
};
