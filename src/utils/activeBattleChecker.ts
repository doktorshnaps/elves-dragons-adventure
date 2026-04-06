/**
 * Utility to check for active battles and dungeons
 * РЕФАКТОРИНГ: Убраны все обращения к localStorage
 * Состояние боя хранится только в Zustand (gameStore)
 */
import { useQueryClient } from '@tanstack/react-query';
import { useGameStore } from '@/stores/gameStore';
import { supabase } from '@/integrations/supabase/client';

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
 * Атомарно очищает активный бой через Zustand, localStorage, БД и Edge Function
 * 
 * Порядок очистки:
 * 1. Очищаем Zustand store (activeBattleInProgress, teamBattleState, battleState)
 * 2. Очищаем localStorage (activeDungeonSession, currentClaimKey)
 * 3. Вызываем Edge Function end-dungeon-session для удаления сессии из БД
 * 4. Очищаем battleState в game_data
 * 5. Инвалидируем кэш React Query
 * 
 * Real-time подписка в useDungeonSync автоматически эмитит 'battleReset' при DELETE
 */
export const clearActiveBattle = async (
  updateGameData?: (data: any) => Promise<void>,
  queryClient?: ReturnType<typeof useQueryClient>,
  walletAddress?: string
) => {
  try {
    console.log('🔄 [clearActiveBattle] Starting atomic battle reset...');
    
    // 1. Clear Zustand state FIRST
    const { clearBattleState, clearTeamBattleState } = useGameStore.getState();
    clearBattleState();
    clearTeamBattleState();
    useGameStore.setState({ activeBattleInProgress: false });
    console.log('✅ [clearActiveBattle] Zustand cleared');
    
    // 2. Clear localStorage
    try {
      localStorage.removeItem('activeDungeonSession');
      localStorage.removeItem('currentClaimKey');
      localStorage.removeItem('teamBattleState');
      localStorage.removeItem('activeBattleInProgress');
      localStorage.removeItem('battleState');
      localStorage.removeItem('game-battle-state');
      console.log('✅ [clearActiveBattle] localStorage cleared');
    } catch (e) {
      console.warn('⚠️ [clearActiveBattle] Failed to clear localStorage:', e);
    }
    
    // 3. Call Edge Function to delete session from DB
    // This triggers real-time subscription which emits 'battleReset'
    const accountId = walletAddress || localStorage.getItem('walletAddress');
    if (accountId) {
      try {
        const { error } = await supabase.functions.invoke('end-dungeon-session', {
          body: { wallet_address: accountId }
        });
        if (error) {
          console.warn('⚠️ [clearActiveBattle] Edge function error:', error);
        } else {
          console.log('✅ [clearActiveBattle] Dungeon session ended via Edge Function');
        }
      } catch (e) {
        console.warn('⚠️ [clearActiveBattle] Failed to call end-dungeon-session:', e);
      }
    }
    
    // 4. Clear database battleState
    if (updateGameData) {
      try {
        await updateGameData({ battleState: null });
        console.log('✅ [clearActiveBattle] game_data.battleState cleared');
      } catch (e) {
        console.warn('⚠️ [clearActiveBattle] Failed to clear battleState in DB:', e);
      }
    }
    
    // 5. Invalidate cache
    if (queryClient) {
      queryClient.invalidateQueries({ queryKey: ['gameData'] });
      queryClient.invalidateQueries({ queryKey: ['cardInstances'] });
      queryClient.invalidateQueries({ queryKey: ['activeDungeonSessions'] });
      console.log('✅ [clearActiveBattle] Cache invalidated');
    }
    
    console.log('✅ [clearActiveBattle] Atomic battle reset complete');
    return true;
  } catch (error) {
    console.error('❌ [clearActiveBattle] Error:', error);
    return false;
  }
};
