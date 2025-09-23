// API optimization utilities
import { gameCache } from './cacheStrategy';

// Batch API requests
export class BatchRequestManager {
  private static instance: BatchRequestManager;
  private batchQueue = new Map<string, any[]>();
  private batchTimers = new Map<string, NodeJS.Timeout>();
  private readonly batchDelay = 50; // 50ms batching window
  
  static getInstance(): BatchRequestManager {
    if (!BatchRequestManager.instance) {
      BatchRequestManager.instance = new BatchRequestManager();
    }
    return BatchRequestManager.instance;
  }
  
  // Add request to batch
  addToBatch<T>(
    batchKey: string,
    requestData: any,
    processor: (batch: any[]) => Promise<T[]>
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      // Add to queue
      if (!this.batchQueue.has(batchKey)) {
        this.batchQueue.set(batchKey, []);
      }
      
      const batch = this.batchQueue.get(batchKey)!;
      batch.push({ requestData, resolve, reject });
      
      // Clear existing timer
      if (this.batchTimers.has(batchKey)) {
        clearTimeout(this.batchTimers.get(batchKey)!);
      }
      
      // Set new timer
      const timer = setTimeout(async () => {
        const currentBatch = this.batchQueue.get(batchKey) || [];
        this.batchQueue.delete(batchKey);
        this.batchTimers.delete(batchKey);
        
        if (currentBatch.length === 0) return;
        
        try {
          const requestsData = currentBatch.map(item => item.requestData);
          const results = await processor(requestsData);
          
          // Resolve individual promises
          currentBatch.forEach((item, index) => {
            item.resolve(results[index]);
          });
        } catch (error) {
          // Reject all promises in batch
          currentBatch.forEach(item => {
            item.reject(error);
          });
        }
      }, this.batchDelay);
      
      this.batchTimers.set(batchKey, timer);
    });
  }
}

// Request deduplication
export class RequestDeduplicator {
  private static instance: RequestDeduplicator;
  private pendingRequests = new Map<string, Promise<any>>();
  
  static getInstance(): RequestDeduplicator {
    if (!RequestDeduplicator.instance) {
      RequestDeduplicator.instance = new RequestDeduplicator();
    }
    return RequestDeduplicator.instance;
  }
  
  async dedupe<T>(
    key: string,
    requestFn: () => Promise<T>,
    cacheTtl: number = 5000 // 5 seconds default
  ): Promise<T> {
    // Check cache first
    const cached = gameCache.get(key);
    if (cached && Date.now() - cached.timestamp < cacheTtl) {
      return cached.data;
    }
    
    // Check if already pending
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key);
    }
    
    // Create new request
    const promise = requestFn().then(result => {
      // Cache result
      gameCache.set(key, {
        data: result,
        timestamp: Date.now()
      });
      
      // Remove from pending
      this.pendingRequests.delete(key);
      
      return result;
    }).catch(error => {
      // Remove from pending on error
      this.pendingRequests.delete(key);
      throw error;
    });
    
    this.pendingRequests.set(key, promise);
    return promise;
  }
}

// Optimized Supabase client with caching
export class OptimizedSupabaseClient {
  private batchManager = BatchRequestManager.getInstance();
  private deduplicator = RequestDeduplicator.getInstance();
  
  constructor(private supabase: any) {}
  
  // Batch card instances updates
  async batchUpdateCardInstances(updates: Array<{id: string, data: any}>): Promise<any[]> {
    return this.batchManager.addToBatch(
      'card_instances_update',
      updates,
      async (batchUpdates: Array<Array<{id: string, data: any}>>) => {
        const allUpdates = batchUpdates.flat();
        
        // Group by operation type for efficiency
        const updateGroups = new Map<string, any[]>();
        allUpdates.forEach(update => {
          const key = JSON.stringify(Object.keys(update.data).sort());
          if (!updateGroups.has(key)) {
            updateGroups.set(key, []);
          }
          updateGroups.get(key)!.push(update);
        });
        
        // Execute grouped updates
        const results = [];
        for (const [_, group] of updateGroups) {
          const { data, error } = await this.supabase
            .from('card_instances')
            .upsert(group.map(item => ({ id: item.id, ...item.data })));
          
          if (error) throw error;
          results.push(...(data || []));
        }
        
        return results;
      }
    );
  }
  
  // Deduplicated game data fetch
  async getGameData(walletAddress: string): Promise<any> {
    return this.deduplicator.dedupe(
      `game_data_${walletAddress}`,
      async () => {
        const { data, error } = await this.supabase.rpc('get_game_data_by_wallet', {
          p_wallet_address: walletAddress
        });
        
        if (error) throw error;
        return data;
      },
      30000 // 30 seconds cache
    );
  }
  
  // Deduplicated card instances fetch
  async getCardInstances(walletAddress: string): Promise<any> {
    return this.deduplicator.dedupe(
      `card_instances_${walletAddress}`,
      async () => {
        const { data, error } = await this.supabase
          .from('card_instances')
          .select('*')
          .eq('wallet_address', walletAddress);
        
        if (error) throw error;
        return data;
      },
      10000 // 10 seconds cache
    );
  }
  
  // Optimized marketplace fetch with pagination
  async getMarketplaceListings(
    page: number = 0,
    limit: number = 20,
    filters?: any
  ): Promise<any> {
    const cacheKey = `marketplace_${page}_${limit}_${JSON.stringify(filters)}`;
    
    return this.deduplicator.dedupe(
      cacheKey,
      async () => {
        let query = this.supabase
          .from('marketplace_listings')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .range(page * limit, (page + 1) * limit - 1);
        
        // Apply filters
        if (filters?.minPrice) {
          query = query.gte('price', filters.minPrice);
        }
        if (filters?.maxPrice) {
          query = query.lte('price', filters.maxPrice);
        }
        if (filters?.cardType) {
          query = query.eq('card_type', filters.cardType);
        }
        
        const { data, error } = await query;
        if (error) throw error;
        return data;
      },
      5000 // 5 seconds cache for marketplace
    );
  }
}

// Connection pooling for better performance
export class ConnectionPool {
  private connections: any[] = [];
  private maxConnections = 5;
  private currentIndex = 0;
  
  constructor(createConnection: () => any) {
    for (let i = 0; i < this.maxConnections; i++) {
      this.connections.push(createConnection());
    }
  }
  
  getConnection(): any {
    const connection = this.connections[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % this.maxConnections;
    return connection;
  }
}

export const batchRequestManager = BatchRequestManager.getInstance();
export const requestDeduplicator = RequestDeduplicator.getInstance();