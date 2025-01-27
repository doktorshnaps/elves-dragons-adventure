import { useState, useEffect } from "react";
import { PlayerStats, Opponent } from "@/types/battle";
import { Item } from "@/types/inventory";
import { useToast } from "./use-toast";
import { useInventoryState } from "./useInventoryState";
import { calculateDamage } from "@/utils/battleCalculations";

export const useBattleState = () => {
  const { toast } = useToast();
  const { inventory, updateInventory } = useInventoryState();
  const [playerStats, setPlayerStats] = useState<PlayerStats>(() => {
    const savedState = localStorage.getItem('battleState');
    if (savedState) {
      const state = JSON.parse(savedState);
      return state.playerStats;
    }
    return {
      health: 100,
      maxHealth: 100,
      power: 10,
      defense: 5,
      experience: 0,
      level: 1,
      requiredExperience: 100
    };
  });

  const [opponents, setOpponents] = useState<Opponent[]>(() => {
    const savedState = localStorage.getItem('battleState');
    if (savedState) {
      const state = JSON.parse(savedState);
      return state.opponents;
    }
    return [];
  });

  const [coins, setCoins] = useState(() => {
    const savedState = localStorage.getItem('battleState');
    if (savedState) {
      const state = JSON.parse(savedState);
      return state.coins || 0;
    }
    return 0;
  });

  const [level, setLevel] = useState(() => {
    const savedState = localStorage.getItem('battleState');
    if (savedState) {
      const state = JSON.parse(savedState);
      return state.currentDungeonLevel || 1;
    }
    return 1;
  });

  const handleUseItem = (item: Item) => {
    if (item.type === 'healthPotion') {
      const newHealth = Math.min(playerStats.maxHealth, playerStats.health + (item.value || 0));
      setPlayerStats(prev => ({
        ...prev,
        health: newHealth
      }));
      
      // Remove the used item from inventory
      const newInventory = inventory.filter(i => i.id !== item.id);
      updateInventory(newInventory);
      
      toast({
        title: "Зелье использовано",
        description: `Восстановлено ${item.value} здоровья`,
      });
    }
  };

  const handleNextLevel = () => {
    setLevel(prev => prev + 1);
    toast({
      title: "Уровень пройден!",
      description: "Вы переходите на следующий уровень подземелья",
    });
  };

  useEffect(() => {
    const battleState = {
      playerStats,
      opponents,
      coins,
      currentDungeonLevel: level
    };
    localStorage.setItem('battleState', JSON.stringify(battleState));
  }, [playerStats, opponents, coins, level]);

  return {
    level,
    coins,
    playerStats,
    setPlayerStats,
    opponents,
    setOpponents,
    setCoins,
    handleUseItem,
    handleNextLevel
  };
};