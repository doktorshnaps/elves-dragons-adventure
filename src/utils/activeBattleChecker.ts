/**
 * Utility to check for active battles and dungeons
 */

export interface ActiveBattleInfo {
  hasActiveBattle: boolean;
  activeDungeon?: string;
  battleType?: 'team' | 'legacy';
}

export const checkActiveBattle = (): ActiveBattleInfo => {
  // Check for team battle state (new system)
  const teamBattleState = localStorage.getItem('teamBattleState');
  const hasActiveBattle = localStorage.getItem('activeBattleInProgress') === 'true';
  
  if (teamBattleState && hasActiveBattle) {
    try {
      const state = JSON.parse(teamBattleState);
      if (state?.selectedDungeon) {
        return {
          hasActiveBattle: true,
          activeDungeon: state.selectedDungeon,
          battleType: 'team'
        };
      }
    } catch (error) {
      console.error('Error parsing teamBattleState:', error);
    }
  }
  
  // Check legacy battle state
  const legacyBattleState = localStorage.getItem('battleState');
  if (legacyBattleState) {
    try {
      const state = JSON.parse(legacyBattleState);
      if (state && Object.keys(state).length > 0) {
        return {
          hasActiveBattle: true,
          battleType: 'legacy'
        };
      }
    } catch (error) {
      console.error('Error parsing legacy battleState:', error);
    }
  }
  
  return {
    hasActiveBattle: false
  };
};

export const clearActiveBattle = async (updateGameData?: (data: any) => Promise<void>) => {
  try {
    // Clear localStorage
    localStorage.removeItem('teamBattleState');
    localStorage.removeItem('activeBattleInProgress');
    localStorage.removeItem('battleState'); // legacy
    
    // Clear database
    if (updateGameData) {
      await updateGameData({ battleState: null });
    }
    
    // Notify components
    window.dispatchEvent(new CustomEvent('battleReset'));
    
    console.log('✅ Active battle cleared');
    return true;
  } catch (error) {
    console.error('❌ Error clearing active battle:', error);
    return false;
  }
};