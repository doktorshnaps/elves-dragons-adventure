import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { usePlayerState } from './usePlayerState';
import { useInventoryState } from './useInventoryState';
import { useBalanceState } from './useBalanceState';
import { useOpponentsState } from './useOpponentsState';
import { useCombat } from './useCombat';
import { Item } from '@/components/battle/Inventory';
import { useEffect } from 'react';
import { calculateTeamStats } from '@/utils/cardUtils';

export const useBattleState = (initialLevel: number = 1) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Calculate initial stats from cards
  const savedCards = localStorage.getItem('gameCards');
  const cards = savedCards ? JSON.parse(savedCards) : [];
  const teamStats = calculateTeamStats(cards);
  
  // Initialize or restore battle state with correct stats and level
  const savedState = localStorage.getItem('battleState');
  const initialState = savedState ? JSON.parse(savedState) : {
    playerStats: {
      health: teamStats.health,
      maxHealth: teamStats.health,
      power: teamStats.power,
      defense: teamStats.defense,
      experience: 0,
      level: initialLevel,
      requiredExperience: 100
    },
    currentDungeonLevel: initialLevel
  };

  // Ensure stats are synced with cards even if state exists
  if (savedState) {
    const parsedState = JSON.parse(savedState);
    initialState.currentDungeonLevel = parsedState.currentDungeonLevel || initialLevel;
    initialState.playerStats = {
      ...parsedState.playerStats,
      power: teamStats.power,
      defense: teamStats.defense,
      maxHealth: teamStats.health,
    };
    localStorage.setItem('battleState', JSON.stringify(initialState));
  }
  
  const { playerStats, setPlayerStats, showLevelUp, handleUpgrade } = usePlayerState(initialState.currentDungeonLevel, initialState.playerStats);
  const { inventory, updateInventory } = useInventoryState();
  const { balance, updateBalance } = useBalanceState();
  const { opponents, setOpponents, handleOpponentDefeat } = useOpponentsState(
    initialState.currentDungeonLevel,
    updateBalance,
    updateInventory
  );

  // Проверяем состояние здоровья персонажа
  useEffect(() => {
    if (playerStats?.health <= 0) {
      toast({
        title: "Поражение!",
        description: "Ваш герой пал в бою. Подземелье закрыто.",
        variant: "destructive"
      });
      
      // Очищаем состояние подземелья
      localStorage.removeItem('battleState');
      
      // Возвращаемся в меню
      setTimeout(() => {
        navigate('/game');
      }, 2000);
    }
  }, [playerStats?.health, navigate, toast]);

  const { isPlayerTurn, attackEnemy, handleOpponentAttack } = useCombat(
    playerStats,
    setPlayerStats,
    opponents,
    setOpponents,
    handleOpponentDefeat
  );

  useEffect(() => {
    if (opponents && opponents.length === 0 && playerStats?.health > 0) {
      toast({
        title: "Уровень завершен!",
        description: "Нажмите кнопку для перехода на следующий уровень",
      });
    }
  }, [opponents, playerStats?.health, toast]);

  const handleNextLevel = () => {
    const nextLevel = initialState.currentDungeonLevel + 1;
    
    // Сохраняем состояние для следующего уровня
    const battleState = {
      playerStats,
      opponents: [], // Очищаем список противников для следующего уровня
      currentDungeonLevel: nextLevel,
      inventory,
      coins: balance
    };
    localStorage.setItem('battleState', JSON.stringify(battleState));
    
    toast({
      title: "Переход на следующий уровень",
      description: `Вы переходите на уровень ${nextLevel}`,
    });

    navigate(`/battle?level=${nextLevel}`, { replace: true });
  };

  // Сохраняем прогресс при каждом изменении состояния
  useEffect(() => {
    if (playerStats?.health > 0) {
      const battleState = {
        playerStats,
        opponents,
        currentDungeonLevel: initialState.currentDungeonLevel,
        inventory,
        coins: balance
      };
      localStorage.setItem('battleState', JSON.stringify(battleState));
    }
  }, [playerStats, opponents, initialState.currentDungeonLevel, inventory, balance]);

  const useItem = (item: Item) => {
    if (!playerStats) return;
    
    const newStats = { ...playerStats };
    
    switch (item.type) {
      case "healthPotion":
        newStats.health = Math.min(newStats.health + item.value, newStats.maxHealth);
        toast({
          title: "Использовано зелье здоровья",
          description: `Восстановлено ${item.value} здоровья`,
        });
        break;
      case "defensePotion":
        newStats.defense += item.value;
        toast({
          title: "Использовано зелье защиты",
          description: `Увеличена защита на ${item.value}`,
        });
        break;
      case "weapon":
        newStats.power += item.value;
        toast({
          title: "Использовано оружие",
          description: `Увеличена сила атаки на ${item.value}`,
        });
        break;
      case "armor":
        newStats.defense += item.value;
        toast({
          title: "Использована броня",
          description: `Увеличена защита на ${item.value}`,
        });
        break;
    }

    setPlayerStats(newStats);
    const newInventory = inventory.filter(i => i.id !== item.id);
    updateInventory(newInventory);
  };

  return {
    level: initialState.currentDungeonLevel,
    coins: balance,
    playerStats,
    opponents,
    inventory,
    showLevelUp,
    isPlayerTurn,
    attackEnemy,
    handleOpponentAttack,
    useItem,
    handleUpgrade,
    setOpponents,
    handleOpponentDefeat,
    updateBalance,
    updateInventory,
    handleNextLevel
  };
};