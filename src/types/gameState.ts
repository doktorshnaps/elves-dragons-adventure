export interface GameData {
  balance: number;
  wood: number;
  stone: number;
  iron: number;
  gold: number;
  maxWood?: number;
  maxStone?: number;
  maxIron?: number;
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
  activeWorkers: any[];
  buildingLevels: any;
  activeBuildingUpgrades: any[];
  // Production persistence (from DB)
  woodLastCollectionTime?: number; // ms epoch
  stoneLastCollectionTime?: number; // ms epoch
  woodProductionData?: { isProducing: boolean; isStorageFull: boolean };
  stoneProductionData?: { isProducing: boolean; isStorageFull: boolean };
}

export interface GameStateActions {
  updateBalance: (balance: number) => Promise<void>;
  updateResources: (resources: { wood?: number; stone?: number; iron?: number; gold?: number }) => Promise<void>;
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