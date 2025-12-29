import { create } from 'zustand';

/**
 * РЕФАКТОРИНГ: gameStore теперь содержит ТОЛЬКО UI-состояние.
 * 
 * Серверные данные (удалены):
 * - inventory → используйте useItemInstances()
 * - dragonEggs → используйте useDragonEggs() из DragonEggContext
 * - cards → используйте useCards()
 * 
 * Все серверные данные приходят через React Query и контексты.
 */

interface GameState {
  // Core game data (синхронизируется с Supabase)
  balance: number;
  selectedTeam: any[];
  
  // Account progression (синхронизируется с Supabase)
  accountLevel: number;
  accountExperience: number;
  
  // Battle state (только UI, не персистируется)
  battleState: any | null;
  activeBattleInProgress: boolean;
  teamBattleState: any | null;
  
  // Actions
  setActiveBattleInProgress: (active: boolean) => void;
  setTeamBattleState: (state: any) => void;
  clearTeamBattleState: () => void;
  setBalance: (balance: number) => void;
  addBalance: (amount: number) => void;
  setSelectedTeam: (team: any[]) => void;
  setBattleState: (state: any) => void;
  clearBattleState: () => void;
  
  // Account progression
  setAccountLevel: (level: number) => void;
  setAccountExperience: (experience: number) => void;
  addAccountExperience: (amount: number) => Promise<void>;
  setAccountData: (level: number, experience: number) => void;
  clearAllData: () => void;
}

export const useGameStore = create<GameState>()((set, get) => ({
  // Initial state - все данные приходят из Supabase через useGameSync
  balance: 0,
  selectedTeam: [],
  accountLevel: 1,
  accountExperience: 0,
  battleState: null,
  activeBattleInProgress: false,
  teamBattleState: null,
  
  // Actions
  setBalance: (balance) => set({ balance }),
  addBalance: (amount) => set((state) => ({ balance: state.balance + amount })),
  
  setSelectedTeam: (selectedTeam) => set({ selectedTeam }),
  setBattleState: (battleState) => set({ battleState }),
  clearBattleState: () => set({ battleState: null }),
  setActiveBattleInProgress: (active: boolean) => set({ activeBattleInProgress: active }),
  setTeamBattleState: (state: any) => set({ teamBattleState: state }),
  clearTeamBattleState: () => set({ teamBattleState: null, activeBattleInProgress: false }),
  
  // Account progression actions
  setAccountLevel: (accountLevel) => set({ accountLevel }),
  setAccountExperience: (accountExperience) => set({ accountExperience }),
  setAccountData: (level: number, experience: number) => {
    set({ accountLevel: level, accountExperience: experience });
  },
  
  addAccountExperience: async (amount: number) => {
    const state = get();
    const newExperience = state.accountExperience + amount;
    const experienceForNextLevel = state.accountLevel * 100;
    
    if (newExperience >= experienceForNextLevel) {
      const newLevel = state.accountLevel + 1;
      const remainingExperience = newExperience - experienceForNextLevel;
      
      set({ 
        accountLevel: newLevel, 
        accountExperience: remainingExperience 
      });
    } else {
      set({ accountExperience: newExperience });
    }
  },
  
  clearAllData: () => {
    set({
      balance: 0,
      selectedTeam: [],
      accountLevel: 1,
      accountExperience: 0,
      battleState: null,
      activeBattleInProgress: false,
      teamBattleState: null,
    });
  },
}));
