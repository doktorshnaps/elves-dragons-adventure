import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Card } from '@/types/cards';
import { Item } from '@/types/inventory';
import { DragonEgg } from '@/contexts/DragonEggContext';
import { supabase } from '@/integrations/supabase/client';
import { getLevelFromXP } from '@/utils/accountLeveling';

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
  
  // Actions
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
  syncAccountData: () => Promise<void>;
  setAccountData: (level: number, experience: number) => void;
  
  // Computed values
  getTeamStats: () => { power: number; defense: number; health: number; maxHealth: number };
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      // Initial state
      balance: 100,
      cards: [],
      inventory: [],
      dragonEggs: [],
      selectedTeam: [],
      accountLevel: 1,
      accountExperience: 0,
      battleState: null,
      
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
      
      // Account progression actions
      setAccountLevel: (accountLevel) => set({ accountLevel }),
      setAccountExperience: (accountExperience) => set({ accountExperience }),
      setAccountData: (level: number, experience: number) => {
        set({ accountLevel: level, accountExperience: experience });
      },
      
      addAccountExperience: async (amount: number) => {
        const { accountExperience } = get();
        const newXP = accountExperience + amount;
        const newLevel = getLevelFromXP(newXP);
        
        // Обновляем локальное состояние
        set({ accountExperience: newXP, accountLevel: newLevel });
        
        // Синхронизируем с Supabase
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await supabase
              .from('game_data')
              .update({ 
                account_level: newLevel, 
                account_experience: newXP 
              })
              .eq('user_id', user.id);
          }
        } catch (error) {
          console.error('Failed to sync account data to Supabase:', error);
        }
      },

      syncAccountData: async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data, error } = await supabase
              .from('game_data')
              .select('account_level, account_experience')
              .eq('user_id', user.id)
              .single();

            if (data && !error) {
              set({ 
                accountLevel: data.account_level || 1, 
                accountExperience: data.account_experience || 0 
              });
            }
          }
        } catch (error) {
          console.error('Failed to sync account data from Supabase:', error);
        }
      },
      
      // Computed values
      getTeamStats: () => {
        const { cards, selectedTeam } = get();
        let totalPower = 0;
        let totalDefense = 0;
        let totalHealth = 0;

        selectedTeam.forEach((pair: any) => {
          if (pair.hero) {
            totalPower += pair.hero.power;
            totalDefense += pair.hero.defense;
            totalHealth += pair.hero.health;
          }
          if (pair.dragon && pair.dragon.faction === pair.hero?.faction) {
            totalPower += pair.dragon.power;
            totalDefense += pair.dragon.defense;
            totalHealth += pair.dragon.health;
          }
        });

        return {
          power: totalPower,
          defense: totalDefense,
          health: totalHealth,
          maxHealth: totalHealth
        };
      }
    }),
    {
      name: 'game-storage',
      partialize: (state) => ({
        balance: state.balance,
        cards: state.cards,
        inventory: state.inventory,
        dragonEggs: state.dragonEggs,
        selectedTeam: state.selectedTeam,
        accountLevel: state.accountLevel,
        accountExperience: state.accountExperience,
      }),
    }
  )
);