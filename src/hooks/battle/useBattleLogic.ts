import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Item } from "@/types/inventory";
import { PlayerStats } from "@/types/battle";
import { applyItemEffect } from "@/utils/itemUtils";
import { useBattleState } from '../useBattleState';

export const useBattleLogic = () => {
  const { toast } = useToast();
  
  const {
    level,
    coins,
    playerStats,
    setPlayerStats,
    opponents,
    inventory,
    isPlayerTurn,
    attackEnemy,
    handleOpponentAttack,
    handleUseItem: removeItem,
    handleNextLevel
  } = useBattleState();

  const handleUseItem = useCallback((item: Item) => {
    if (!playerStats) return;

    const newStats = applyItemEffect(item, playerStats);
    setPlayerStats(newStats);
    removeItem(item);

    let effectDescription = "";
    switch (item.name) {
      case "Зелье здоровья":
        effectDescription = `Восстановлено ${item.value} здоровья`;
        break;
      case "Зелье защиты":
        effectDescription = `Увеличена защита на ${item.value}`;
        break;
      case "Старый железный меч":
        effectDescription = `Увеличена сила на ${item.value}`;
        break;
      case "Кожаная броня":
        effectDescription = `Увеличена защита на ${item.value}`;
        break;
    }

    toast({
      title: "Предмет использован",
      description: effectDescription,
    });
  }, [playerStats, setPlayerStats, removeItem, toast]);

  const handleExitDungeon = useCallback(() => {
    const battleState = localStorage.getItem('battleState');
    if (battleState) {
      const state = JSON.parse(battleState);
      if (state.playerStats.health > 0) {
        toast({
          title: "Подземелье покинуто",
          description: `Вы покинули подземелье. Весь прогресс сброшен.`,
        });
      }
      localStorage.removeItem('battleState');
    }
  }, [toast]);

  return {
    level,
    coins,
    playerStats,
    opponents,
    inventory,
    isPlayerTurn,
    attackEnemy,
    handleOpponentAttack,
    handleUseItem,
    handleExitDungeon,
    handleNextLevel
  };
};