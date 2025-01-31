import { usePlayerState } from './usePlayerState';
import { useInventoryState } from './useInventoryState';
import { useBalanceState } from './useBalanceState';
import { useOpponentsState } from './useOpponentsState';
import { useCombat } from './useCombat';
import { useToast } from './use-toast';
import { useEffect } from 'react';
import { usePlayerHealthCheck } from './battle/usePlayerHealthCheck';
import { useDungeonLevelManager } from './battle/useDungeonLevelManager';
import { useBattleStateManager } from './battle/useBattleStateManager';
import { useInitialBattleState } from './battle/useInitialBattleState';
import { useItemHandling } from './battle/useItemHandling';

export const useBattleState = (initialLevel: number = 1) => {
  const { toast } = useToast();
  const initialState = useInitialBattleState(initialLevel);
  
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

  const { useItem } = useItemHandling(playerStats, setPlayerStats, updateInventory, inventory);

  useEffect(() => {
    if (opponents && opponents.length === 0 && playerStats?.health > 0) {
      toast({
        title: "Уровень завершен!",
        description: "Нажмите кнопку для перехода на следующий уровень",
        duration: 2000
      });
    }
  }, [opponents, playerStats?.health, toast]);

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