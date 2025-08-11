import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Card } from '@/types/cards';
import { Item } from '@/types/inventory';
import { DragonEgg } from '@/contexts/DragonEggContext';

interface GameState {
  // Core game data
  balance: number;
  cards: Card[];
  inventory: Item[];
  dragonEggs: DragonEgg[];
  selectedTeam: any[];
  
  // Player stats
  playerLevel: number;
  playerExperience: number;
  
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
      playerLevel: 1,
      playerExperience: 0,
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
        playerLevel: state.playerLevel,
        playerExperience: state.playerExperience,
      }),
    }
  )
);