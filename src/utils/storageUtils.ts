type StorageData = {
  gameCards?: any[];
  gameInventory?: any[];
  gameBalance?: number;
  battleState?: any;
  dragonEggs?: any[];
  socialQuests?: any[];
  marketplaceListings?: any[];
  gameInitialized?: boolean;
};

export const loadFromStorage = <T>(key: keyof StorageData): T | null => {
  try {
    const data = localStorage.getItem(key.toString());
    return data ? JSON.parse(data) as T : null;
  } catch (error) {
    console.error(`Error loading ${key} from storage:`, error);
    return null;
  }
};

export const saveToStorage = <T>(key: keyof StorageData, data: T): void => {
  try {
    localStorage.setItem(key.toString(), JSON.stringify(data));
  } catch (error) {
    console.error(`Error saving ${key} to storage:`, error);
  }
};