import { usePlayerState } from './usePlayerState';
import { useInventoryState } from './useInventoryState';
import { useBalanceState } from './useBalanceState';
import { useOpponentsState } from './useOpponentsState';
import { useCombat } from './useCombat';
import { useToast } from './use-toast';
import { Item } from "@/types/inventory";

import { useEffect } from 'react';
import { calculateTeamStats } from '@/utils/cardUtils';
import { usePlayerHealthCheck } from './battle/usePlayerHealthCheck';
import { useDungeonLevelManager } from './battle/useDungeonLevelManager';
import { useBattleStateManager } from './battle/useBattleStateManager';

export const useBattleState = (initialLevel: number = 1) => {
  const { toast } = useToast();
  
  const savedState = localStorage.getItem('battleState');
  let initialState;
  
  if (savedState) {
    initialState = JSON.parse(savedState);
  } else {
    const savedCards = localStorage.getItem('gameCards');
    const cards = savedCards ? JSON.parse(savedCards) : [];
    const teamStats = calculateTeamStats(cards);
    
    initialState = {
      playerStats: {
        health: teamStats.health,
        maxHealth: teamStats.health,
        power: teamStats.power,
        defense: teamStats.defense
      },
      currentDungeonLevel: initialLevel,
      selectedDungeon: null
    };
  }

  const { playerStats, setPlayerStats } = usePlayerState(initialState.playerStats);
  const { inventory, updateInventory } = useInventoryState();
  const { balance, updateBalance } = useBalanceState();
  const { opponents, setOpponents, handleOpponentDefeat } = useOpponentsState(
    initialState.currentDungeonLevel,
    updateBalance,
    updateInventory
  );

  usePlayerHealthCheck(playerStats);

  const { isPlayerTurn, attackEnemy, handleOpponentAttack } = useCombat(
    playerStats,
    setPlayerStats,
    opponents,
    setOpponents,
    handleOpponentDefeat
  );

  const { handleNextLevel } = useDungeonLevelManager(playerStats, initialState, setOpponents);

  useBattleStateManager(playerStats, opponents, initialState, inventory, balance);

  useEffect(() => {
    if (opponents && opponents.length === 0 && playerStats?.health > 0) {
      toast({
        title: "Уровень завершен!",
        description: "Нажмите кнопку для перехода на следующий уровень",
        duration: 2000
      });
    }
  }, [opponents, playerStats?.health, toast]);

  const useItem = (item: Item) => {
    if (!playerStats) return;
    
    if (item.type === "healthPotion") {
      const newHealth = Math.min(playerStats.maxHealth, playerStats.health + item.value);
      setPlayerStats({
        ...playerStats,
        health: newHealth
      });
      
      toast({
        title: "Зелье использовано",
        description: `Восстановлено ${item.value} здоровья`,
        duration: 2000
      });
    } else if (item.type === "cardPack") {
      toast({
        title: "Недоступно",
        description: "Колоды карт можно использовать только в магазине",
        duration: 2000
      });
      return; // Не удаляем предмет, если это колода карт
    }

    // Удаляем использованный предмет из инвентаря
    const newInventory = inventory.filter(i => i.id !== item.id);
    updateInventory(newInventory);

    // Сохраняем обновленное состояние боя
    const battleState = {
      playerStats: playerStats,
      currentDungeonLevel: initialState.currentDungeonLevel,
      selectedDungeon: initialState.selectedDungeon
    };
    localStorage.setItem('battleState', JSON.stringify(battleState));
  };

  return {
    level: initialState.currentDungeonLevel,
    coins: balance,
    playerStats,
    setPlayerStats, // Added this line to expose setPlayerStats
    opponents,
    inventory,
    isPlayerTurn,
    attackEnemy,
    handleOpponentAttack,
    useItem,
    setOpponents,
    handleOpponentDefeat,
    updateBalance,
    updateInventory,
    handleNextLevel
  };
};