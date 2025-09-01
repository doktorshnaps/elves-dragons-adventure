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
  syncAccountData: (walletAddress: string) => Promise<void>;
  initializeAccountData: (walletAddress: string) => Promise<void>;
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
          const walletAddress = localStorage.getItem('walletAccountId');
          if (walletAddress) {
            await supabase
              .from('game_data')
              .update({ 
                account_level: newLevel, 
                account_experience: newXP 
              })
              .eq('wallet_address', walletAddress);
          }
        } catch (error) {
          console.error('Failed to sync account data to Supabase:', error);
        }
      },

      syncAccountData: async (walletAddress: string) => {
        try {
          // Сброс состояния перед загрузкой новых данных
          set({ 
            accountLevel: 1, 
            accountExperience: 0,
            balance: 100,
            cards: [],
            inventory: [],
            selectedTeam: [],
            dragonEggs: [],
            battleState: null
          });

          const { data, error } = await supabase
            .from('game_data')
            .select('account_level, account_experience, balance, cards, inventory, selected_team, dragon_eggs')
            .eq('wallet_address', walletAddress)
            .maybeSingle();

            if (data && !error) {
              set({ 
                accountLevel: data.account_level || 1, 
                accountExperience: data.account_experience || 0,
                balance: data.balance || 100,
                cards: Array.isArray(data.cards) ? (data.cards as unknown as Card[]) : [],
                inventory: Array.isArray(data.inventory) ? (data.inventory as unknown as Item[]) : [],
                selectedTeam: Array.isArray(data.selected_team) ? data.selected_team : [],
                dragonEggs: Array.isArray(data.dragon_eggs) ? (data.dragon_eggs as unknown as DragonEgg[]) : []
              });
            }
        } catch (error) {
          console.error('Failed to sync account data from Supabase:', error);
        }
      },

      initializeAccountData: async (walletAddress: string) => {
        try {
          // Check if account already exists
          const { data: existingData } = await supabase
            .from('game_data')
            .select('id')
            .eq('wallet_address', walletAddress)
            .maybeSingle();
            
           if (!existingData) {
             // Create new account data for this wallet
             await supabase
               .from('game_data')
               .insert({
                 user_id: walletAddress,
                 wallet_address: walletAddress,
                 balance: 100,
                 account_level: 1,
                 account_experience: 0,
                 cards: [],
                 inventory: [],
                 selected_team: [],
                 dragon_eggs: [],
                 initialized: true
               });
               
             // Also create profile
             await supabase
               .from('profiles')
               .insert({
                 user_id: walletAddress,
                 wallet_address: walletAddress,
                 display_name: walletAddress.substring(0, 8) + '...'
               });
           }
        } catch (error) {
          console.error('Failed to initialize account data:', error);
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