import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Card } from '@/types/cards';
import { Item } from '@/types/inventory';
import { DragonEgg } from '@/contexts/DragonEggContext';
import { supabase } from '@/integrations/supabase/client';
import { secureSetItem, secureGetItem, clearCriticalData, validateCriticalData } from '@/utils/secureStorage';

interface GameState {
  // Core game data
  balance: number;
  cards: Card[];
  inventory: Item[];
  dragonEggs: DragonEgg[];
  selectedTeam: any[];
  
  // Account progression
  accountLevel: number;
  accountExperience: number;
  
  // Battle state
  battleState: any | null;
  activeBattleInProgress: boolean;
  teamBattleState: any | null;
  
  // Equipment state
  equippedItems: Item[];
  
  // Actions
  setActiveBattleInProgress: (active: boolean) => void;
  setTeamBattleState: (state: any) => void;
  clearTeamBattleState: () => void;
  setEquippedItems: (items: Item[]) => void;
  equipItem: (item: Item, slot: string) => void;
  unequipItem: (itemId: string) => void;
  setBalance: (balance: number) => void;
  addBalance: (amount: number) => void;
  setCards: (cards: Card[]) => void;
  addCard: (card: Card) => void;
  removeCard: (cardId: string) => void;
  setInventory: (inventory: Item[]) => void;
  addItem: (item: Item) => void;
  removeItem: (itemId: string) => void;
  setDragonEggs: (eggs: DragonEgg[]) => void;
  addDragonEgg: (egg: DragonEgg) => void;
  removeDragonEgg: (eggId: string) => void;
  setSelectedTeam: (team: any[]) => void;
  setBattleState: (state: any) => void;
  clearBattleState: () => void;
  
  // Account progression
  setAccountLevel: (level: number) => void;
  setAccountExperience: (experience: number) => void;
  addAccountExperience: (amount: number) => Promise<void>;
  initializeAccountData: (walletAddress: string) => Promise<void>;
  setAccountData: (level: number, experience: number) => void;
  clearAllData: () => void;
  
  // Computed values
  getTeamStats: () => { power: number; defense: number; health: number; maxHealth: number };
}

// Helper to get wallet address from window context
const getWalletAddress = (): string | null => {
  try {
    // This will be set by WalletConnectContext
    return (window as any).__WALLET_ADDRESS__ || null;
  } catch {
    return null;
  }
};

export const useGameStore = create<GameState>()((set, get) => ({
  // Initial state - все данные приходят из Supabase через useGameSync
  balance: 0,
  cards: [],
  inventory: [],
  dragonEggs: [],
  selectedTeam: [],
  accountLevel: 1,
  accountExperience: 0,
  battleState: null,
  activeBattleInProgress: false,
  teamBattleState: null,
  equippedItems: [],
  
  // Actions
  setBalance: (balance) => set({ balance }),
  addBalance: (amount) => set((state) => ({ balance: state.balance + amount })),
  
  setCards: (cards) => set({ cards }),
  addCard: (card) => set((state) => ({ cards: [...state.cards, card] })),
  removeCard: (cardId) => set((state) => ({ 
    cards: state.cards.filter(c => c.id !== cardId) 
  })),
  
  setInventory: (inventory) => set({ inventory }),
  addItem: (item) => set((state) => ({ inventory: [...state.inventory, item] })),
  removeItem: (itemId) => set((state) => ({ 
    inventory: state.inventory.filter(i => i.id !== itemId) 
  })),
  
  setDragonEggs: (dragonEggs) => set({ dragonEggs }),
  addDragonEgg: (egg) => set((state) => ({ dragonEggs: [...state.dragonEggs, egg] })),
  removeDragonEgg: (eggId) => set((state) => ({ 
    dragonEggs: state.dragonEggs.filter(e => e.id !== eggId) 
  })),
  
  setSelectedTeam: (selectedTeam) => set({ selectedTeam }),
  setBattleState: (battleState) => set({ battleState }),
  clearBattleState: () => set({ battleState: null }),
  setActiveBattleInProgress: (active: boolean) => set({ activeBattleInProgress: active }),
  setTeamBattleState: (state: any) => set({ teamBattleState: state }),
  clearTeamBattleState: () => set({ teamBattleState: null, activeBattleInProgress: false }),
  
  // Equipment actions
  setEquippedItems: (equippedItems) => set({ equippedItems }),
  equipItem: (item: Item, slot: string) => {
    const state = get();
    const updatedInventory = state.inventory.map((invItem) => {
      if (invItem.equipped && invItem.slot === slot) {
        return { ...invItem, equipped: false };
      }
      if (invItem.id === item.id) {
        return { ...invItem, equipped: true };
      }
      return invItem;
    });
    const equipped = updatedInventory.filter((item) => item.equipped);
    set({ inventory: updatedInventory, equippedItems: equipped });
  },
  unequipItem: (itemId: string) => {
    const state = get();
    const updatedInventory = state.inventory.map((invItem) => {
      if (invItem.id === itemId) {
        return { ...invItem, equipped: false };
      }
      return invItem;
    });
    const equipped = updatedInventory.filter((item) => item.equipped);
    set({ inventory: updatedInventory, equippedItems: equipped });
  },
  
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
    
    // Убраны дублирующиеся UPDATE - синхронизация происходит через useZustandSupabaseSync
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
  
  initializeAccountData: async (walletAddress: string) => {
    if (!walletAddress) return;

    const { data, error } = await supabase
      .from('game_data')
      .select('account_level, account_experience')
      .eq('wallet_address', walletAddress)
      .maybeSingle();

    if (!error && data) {
      set({
        accountLevel: data.account_level || 1,
        accountExperience: data.account_experience || 0,
      });
    }
  },
  
  clearAllData: () => {
    set({
      balance: 0,
      cards: [],
      inventory: [],
      dragonEggs: [],
      selectedTeam: [],
      accountLevel: 1,
      accountExperience: 0,
      battleState: null,
      activeBattleInProgress: false,
      teamBattleState: null,
      equippedItems: [],
    });
  },
  
  getTeamStats: () => {
    const state = get();
    const team = state.selectedTeam || [];
    
    let totalPower = 0;
    let totalDefense = 0;
    let totalHealth = 0;
    
    team.forEach((member: any) => {
      const card = state.cards.find((c: Card) => c.id === member.id);
      if (card) {
        totalPower += card.power || 0;
        totalDefense += card.defense || 0;
        totalHealth += card.currentHealth || card.health || 0;
      }
    });
    
    return {
      power: totalPower,
      defense: totalDefense,
      health: totalHealth,
      maxHealth: totalHealth
    };
  }
}));
