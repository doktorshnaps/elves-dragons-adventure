export interface GameData {
  balance: number;
  cards: any[];
  initialized: boolean;
  inventory: any[];
  dragonEggs: any[];
  selectedTeam: any[];
  battleState: any;
  marketplaceListings: any[];
  socialQuests: any[];
  adventurePlayerStats: any;
  adventureCurrentMonster: any;
  barracksUpgrades: any[];
  dragonLairUpgrades: any[];
  accountLevel: number;
  accountExperience: number;
}

export interface GameStateActions {
  updateBalance: (balance: number) => Promise<void>;
  updateInventory: (inventory: any[]) => Promise<void>;
  updateCards: (cards: any[]) => Promise<void>;
  batchUpdate: (updates: Partial<GameData>) => Promise<void>;
  optimisticUpdate: <T>(key: keyof GameData, value: T, serverAction: () => Promise<GameData>) => Promise<void>;
}

export interface UnifiedGameState extends GameData {
  loading: boolean;
  error: string | null;
  actions: GameStateActions;
}

export interface BatchUpdate {
  key: keyof GameData;
  value: any;
  timestamp: number;
}