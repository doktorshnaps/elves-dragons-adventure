// Caching strategy for game resources
export class GameCacheManager {
  private static instance: GameCacheManager;
  private memoryCache = new Map<string, any>();
  private cacheSize = 0;
  private readonly maxCacheSize = 50 * 1024 * 1024; // 50MB
  
  static getInstance(): GameCacheManager {
    if (!GameCacheManager.instance) {
      GameCacheManager.instance = new GameCacheManager();
    }
    return GameCacheManager.instance;
  }
  
  // Memory cache with size tracking
  set(key: string, value: any, size?: number): void {
    const estimatedSize = size || this.estimateSize(value);
    
    // Evict if cache is full
    if (this.cacheSize + estimatedSize > this.maxCacheSize) {
      this.evictLRU(estimatedSize);
    }
    
    this.memoryCache.set(key, {
      value,
      size: estimatedSize,
      timestamp: Date.now(),
      accessCount: 0
    });
    
    this.cacheSize += estimatedSize;
  }
  
  get(key: string): any {
    const cached = this.memoryCache.get(key);
    if (cached) {
      cached.accessCount++;
      cached.lastAccessed = Date.now();
      return cached.value;
    }
    return null;
  }
  
  // LRU eviction
  private evictLRU(neededSize: number): void {
    const entries = Array.from(this.memoryCache.entries());
    
    // Sort by last accessed time
    entries.sort((a, b) => (a[1].lastAccessed || 0) - (b[1].lastAccessed || 0));
    
    let freedSize = 0;
    for (const [key, data] of entries) {
      this.memoryCache.delete(key);
      this.cacheSize -= data.size;
      freedSize += data.size;
      
      if (freedSize >= neededSize) break;
    }
  }
  
  private estimateSize(value: any): number {
    if (typeof value === 'string') return value.length * 2;
    if (typeof value === 'object') return JSON.stringify(value).length * 2;
    return 1024; // Default estimate
  }
  
  // Game-specific cache methods
  cacheGameData(walletAddress: string, gameData: any): void {
    this.set(`game_data_${walletAddress}`, gameData);
  }
  
  getCachedGameData(walletAddress: string): any {
    return this.get(`game_data_${walletAddress}`);
  }
  
  cacheCardData(cardId: string, cardData: any): void {
    this.set(`card_${cardId}`, cardData);
  }
  
  getCachedCardData(cardId: string): any {
    return this.get(`card_${cardId}`);
  }
  
  // Clear cache
  clear(): void {
    this.memoryCache.clear();
    this.cacheSize = 0;
  }
  
  // Cache statistics
  getStats(): { size: number; entries: number; hitRate: number } {
    const entries = Array.from(this.memoryCache.values());
    const totalAccess = entries.reduce((sum, entry) => sum + entry.accessCount, 0);
    const hits = entries.filter(entry => entry.accessCount > 0).length;
    
    return {
      size: this.cacheSize,
      entries: this.memoryCache.size,
      hitRate: totalAccess > 0 ? hits / totalAccess : 0
    };
  }
}

// Service Worker registration for game assets
export const registerGameServiceWorker = async (): Promise<void> => {
  if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
    try {
      const registration = await navigator.serviceWorker.register('/game-sw.js');
      console.log('🔧 Game Service Worker registered:', registration);
      
      // Handle updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('🔄 New game content available, reload to update');
              // Можно показать уведомление пользователю
            }
          });
        }
      });
    } catch (error) {
      console.warn('🚫 Service Worker registration failed:', error);
    }
  }
};

// IndexedDB for persistent game cache
export class PersistentGameCache {
  private dbName = 'GameCache';
  private version = 1;
  private db: IDBDatabase | null = null;
  
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = () => {
        const db = request.result;
        
        // Game data store
        if (!db.objectStoreNames.contains('gameData')) {
          const gameStore = db.createObjectStore('gameData', { keyPath: 'walletAddress' });
          gameStore.createIndex('timestamp', 'timestamp');
        }
        
        // Assets store
        if (!db.objectStoreNames.contains('assets')) {
          const assetStore = db.createObjectStore('assets', { keyPath: 'url' });
          assetStore.createIndex('type', 'type');
        }
      };
    });
  }
  
  async storeGameData(walletAddress: string, data: any): Promise<void> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction(['gameData'], 'readwrite');
    const store = transaction.objectStore('gameData');
    
    await store.put({
      walletAddress,
      data,
      timestamp: Date.now()
    });
  }
  
  async getGameData(walletAddress: string): Promise<any> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction(['gameData'], 'readonly');
    const store = transaction.objectStore('gameData');
    
    return new Promise((resolve) => {
      const request = store.get(walletAddress);
      request.onsuccess = () => {
        resolve(request.result?.data || null);
      };
      request.onerror = () => resolve(null);
    });
  }
}

export const gameCache = GameCacheManager.getInstance();
export const persistentCache = new PersistentGameCache();