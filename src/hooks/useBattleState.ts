import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { usePlayerState } from './usePlayerState';
import { useInventoryState } from './useInventoryState';
import { useBalanceState } from './useBalanceState';
import { useOpponentsState } from './useOpponentsState';
import { useCombat } from './useCombat';
import { Item } from '@/components/battle/Inventory';
import { useEffect } from 'react';

export const useBattleState = (initialLevel: number = 1) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const { playerStats, setPlayerStats, showLevelUp, handleUpgrade } = usePlayerState(initialLevel);
  const { inventory, updateInventory } = useInventoryState();
  const { balance, updateBalance } = useBalanceState();
  const { opponents = [], setOpponents, handleOpponentDefeat } = useOpponentsState(
    initialLevel,
    updateBalance,
    updateInventory
  );

  const { isPlayerTurn, attackEnemy, handleOpponentAttack } = useCombat(
    playerStats,
    setPlayerStats,
    opponents,
    setOpponents,
    handleOpponentDefeat
  );

  useEffect(() => {
    if (opponents && opponents.length === 0 && playerStats?.health > 0) {
      const nextLevel = initialLevel + 1;
      
      // Сохраняем состояние для следующего уровня
      const battleState = {
        playerStats,
        opponents: [], // Очищаем список противников для следующего уровня
        level: nextLevel,
        inventory,
        coins: balance
      };
      localStorage.setItem('battleState', JSON.stringify(battleState));
      
      // Показываем сообщение о завершении уровня
      toast({
        title: "Уровень пройден!",
        description: `Вы переходите на уровень ${nextLevel}`,
      });

      // Переходим на следующий уровень с небольшой задержкой
      setTimeout(() => {
        navigate(`/battle?level=${nextLevel}`, { replace: true });
      }, 1000);
    }
  }, [opponents, initialLevel, navigate, playerStats, toast, inventory, balance]);

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
    level: initialLevel,
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
    updateInventory
  };
};