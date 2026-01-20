/**
 * Utility to check for active battles and dungeons
 * РЕФАКТОРИНГ: Убраны все обращения к localStorage
 * Состояние боя хранится только в Zustand (gameStore)
 */
import { useQueryClient } from '@tanstack/react-query';
import { useGameStore } from '@/stores/gameStore';

export interface ActiveBattleInfo {
  hasActiveBattle: boolean;
  activeDungeon?: string;
  battleType?: 'team' | 'legacy';
}

/**
 * Проверяет наличие активного боя через Zustand store
 */
export const checkActiveBattle = (): ActiveBattleInfo => {
  const state = useGameStore.getState();
  
  // Check for active battle in Zustand
  if (state.activeBattleInProgress && state.teamBattleState) {
    return {
      hasActiveBattle: true,
      activeDungeon: state.teamBattleState.selectedDungeon,
      battleType: 'team'
    };
  }
  
  // Check legacy battle state in Zustand
  if (state.battleState) {
    return {
      hasActiveBattle: true,
      battleType: 'legacy'
    };
  }
  
  return {
    hasActiveBattle: false
  };
};

/**
 * Очищает активный бой через Zustand и Supabase
 */
export const clearActiveBattle = async (
  updateGameData?: (data: any) => Promise<void>,
  queryClient?: ReturnType<typeof useQueryClient>
) => {
  try {
    // Clear Zustand state
    const { clearBattleState, clearTeamBattleState } = useGameStore.getState();
    clearBattleState();
    clearTeamBattleState();
    
    // Clear database
    if (updateGameData) {
      await updateGameData({ battleState: null });
    }
    
    // Инвалидируем кэш
    if (queryClient) {
      queryClient.invalidateQueries({ queryKey: ['gameData'] });
      queryClient.invalidateQueries({ queryKey: ['cardInstances'] });
    }
    
    console.log('✅ Active battle cleared (Zustand + DB)');
    return true;
  } catch (error) {
    console.error('❌ Error clearing active battle:', error);
    return false;
  }
};
