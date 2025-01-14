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
import { generateDungeonOpponents } from '@/dungeons/dungeonManager';

export const useBattleState = (initialLevel: number = 1) => {
  const navigate = useNavigate();
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

  useEffect(() => {
    if (playerStats?.health <= 0) {
      toast({
        title: "Поражение!",
        description: "Ваш герой пал в бою. Подземелье закрыто.",
        variant: "destructive",
        duration: 1000
      });
      
      localStorage.removeItem('battleState');
      
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
        duration: 1000
      });
    }
  }, [opponents, playerStats?.health, toast]);

  const handleNextLevel = () => {
    const nextLevel = initialState.currentDungeonLevel + 1;
    const selectedDungeon = initialState.selectedDungeon;
    
    if (!selectedDungeon) {
      toast({
        title: "Ошибка",
        description: "Подземелье не выбрано",
        variant: "destructive"
      });
      navigate('/game');
      return;
    }
    
    const newOpponents = generateDungeonOpponents(selectedDungeon, nextLevel);
    
    const battleState = {
      playerStats: {
        ...playerStats
      },
      opponents: newOpponents,
      currentDungeonLevel: nextLevel,
      inventory,
      coins: balance,
      selectedDungeon
    };
    localStorage.setItem('battleState', JSON.stringify(battleState));
    
    toast({
      title: "Переход на следующий уровень",
      description: `Вы переходите на уровень ${nextLevel}`,
      duration: 1000
    });

    navigate(`/battle?level=${nextLevel}`, { replace: true });
  };

  useEffect(() => {
    if (playerStats?.health > 0) {
      const battleState = {
        playerStats,
        opponents,
        currentDungeonLevel: initialState.currentDungeonLevel,
        inventory,
        coins: balance,
        selectedDungeon: initialState.selectedDungeon
      };
      localStorage.setItem('battleState', JSON.stringify(battleState));
    }
  }, [playerStats?.health, playerStats?.defense, opponents, initialState.currentDungeonLevel, inventory, balance, initialState.selectedDungeon]);

  const useItem = (item: Item) => {
    if (!playerStats) return;
    
    if (item.type === "cardPack") {
      toast({
        title: "Недоступно",
        description: "Колоды карт можно использовать только в магазине",
        duration: 1000
      });
    }

    const newInventory = inventory.filter(i => i.id !== item.id);
    updateInventory(newInventory);
  };

  return {
    level: initialState.currentDungeonLevel,
    coins: balance,
    playerStats,
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