import { usePlayerState } from './usePlayerState';
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
import { useGameStore } from '@/stores/gameStore';

export const useBattleState = (initialLevel: number = 1) => {
  const { toast } = useToast();
  const initialState = useInitialBattleState(initialLevel);
  const { cards, selectedTeam } = useGameStore();
  
  // Получаем карты из выбранной команды
  const teamCards = selectedTeam.map(pair => pair.hero).filter(Boolean);
  
  const { playerStats, setPlayerStats } = usePlayerState(initialState.playerStats);
  const { balance, updateBalance } = useBalanceState();
  // inventory управляется через item_instances напрямую
  const { opponents, setOpponents, handleOpponentDefeat } = useOpponentsState(
    initialState.currentDungeonLevel,
    updateBalance,
    (items) => {} // Stub function - items added via item_instances
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

  useBattleStateManager(playerStats, opponents, initialState, [], balance);

  const { useItem } = useItemHandling(playerStats, setPlayerStats, (items) => {}, []);

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
    inventory: [], // inventory теперь через item_instances
    isPlayerTurn,
    attackEnemy,
    handleOpponentAttack,
    useItem,
    setOpponents,
    handleOpponentDefeat,
    updateBalance,
    updateInventory: (items: any[]) => {}, // Stub - items managed via item_instances
    handleNextLevel
  };
};