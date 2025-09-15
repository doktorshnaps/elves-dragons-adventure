import { useState, useCallback, useEffect } from 'react';
import { calculateTeamStats } from '@/utils/cardUtils';
import { useToast } from '@/hooks/use-toast';
import { useGameData } from '@/hooks/useGameData';
import { useCardInstances } from '@/hooks/useCardInstances';
import { Card } from '@/types/cards';

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
  const { gameData, updateGameData } = useGameData();
  const { cardInstances } = useCardInstances();
  
  const calculateEquipmentBonuses = useCallback(() => {
    if (!gameData.inventory) return { power: 0, defense: 0, health: 0 };

    const equippedItems = gameData.inventory.filter((item: any) => item.equipped);
    return equippedItems.reduce((acc: any, item: any) => ({
      power: acc.power + (item.stats?.power || 0),
      defense: acc.defense + (item.stats?.defense || 0),
      health: acc.health + (item.stats?.health || 0)
    }), { power: 0, defense: 0, health: 0 });
  }, [gameData.inventory]);

  const calculateBaseStats = useCallback((level: number) => {
    const teamStats = calculateTeamStats(gameData.cards);

    return {
      power: teamStats.power + (level - 1),
      defense: teamStats.defense + (level - 1),
      health: teamStats.health + (level - 1) * 10
    };
  }, [gameData.cards]);

  // Calculate current and max team health based on selected team and card_instances
  const getTeamHealthSums = useCallback(() => {
    const cards = (gameData.cards as Card[]) || [];
    const selected = (gameData.selectedTeam as any[]) || [];
    const byId = new Map<string, Card>(cards.map((c) => [c.id, c]));
    
    // Create map of card instances for quick lookup of current health
    const instancesById = new Map(cardInstances.map(inst => [inst.card_template_id, inst]));

    let currentSum = 0;
    let maxSum = 0;

    selected.forEach((pair) => {
      const heroFromMap = byId.get(pair?.hero?.id) || pair?.hero;
      if (heroFromMap) {
        const heroMax = heroFromMap.health || pair.hero?.health || 0;
        // Use actual health from card_instances if available, otherwise fallback to card data
        const heroInstance = instancesById.get(heroFromMap.id);
        const heroCur = heroInstance ? heroInstance.current_health : (heroFromMap.currentHealth ?? heroMax);
        maxSum += heroMax;
        currentSum += Math.max(0, Math.min(heroCur, heroMax));
      }

      const dragon = pair?.dragon;
      if (dragon) {
        const dragonFromMap = byId.get(dragon.id) || dragon;
        // Dragon contributes only if same faction and allowed by rarity, like calculateTeamStats
        const sameFaction = pair?.hero?.faction && dragonFromMap?.faction && pair.hero.faction === dragonFromMap.faction;
        const rarityOk = (pair?.hero?.rarity ?? 0) >= (dragonFromMap?.rarity ?? 0);
        if (sameFaction && rarityOk) {
          const dMax = dragonFromMap.health || dragon.health || 0;
          // Use actual health from card_instances if available
          const dragonInstance = instancesById.get(dragonFromMap.id);
          const dCur = dragonInstance ? dragonInstance.current_health : (dragonFromMap.currentHealth ?? dMax);
          maxSum += dMax;
          currentSum += Math.max(0, Math.min(dCur, dMax));
        }
      }
    });

    return { currentSum, maxSum };
  }, [gameData.cards, gameData.selectedTeam, cardInstances]);

  const [stats, setStats] = useState<PlayerStats>(() => {
    if (gameData.adventurePlayerStats) {
      const parsed = gameData.adventurePlayerStats;
      const baseStats = calculateBaseStats(parsed.level);
      const equipmentBonuses = calculateEquipmentBonuses();
      const { currentSum } = getTeamHealthSums();
      
      const newMax = baseStats.health + equipmentBonuses.health;
      const allowedCurrent = Math.min(currentSum + equipmentBonuses.health, newMax);
      
      return {
        ...parsed,
        power: baseStats.power + equipmentBonuses.power,
        defense: baseStats.defense + equipmentBonuses.defense,
        maxHealth: newMax,
        health: Math.min(parsed.health, allowedCurrent)
      };
    }

    const baseStats = calculateBaseStats(initialLevel);
    const equipmentBonuses = calculateEquipmentBonuses();
    const { currentSum } = getTeamHealthSums();
    
    const newMax = baseStats.health + equipmentBonuses.health;
    const allowedCurrent = Math.min(currentSum + equipmentBonuses.health, newMax);
    
    return {
      health: allowedCurrent,
      maxHealth: newMax,
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
      updateGameData({ adventurePlayerStats: newStats });
      return newStats;
    });
  }, [updateGameData]);

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
