// Централизованная система мониторинга метрик производительности

export interface PerformanceMetrics {
  // Latency запросов к БД
  dbLatency: {
    current: number;
    average: number;
    max: number;
    calls: number;
    threshold: number; // 100ms
  };
  
  // Размер localStorage
  localStorage: {
    currentSize: number; // в байтах
    limit: number; // 1MB = 1048576 bytes
    percentage: number;
  };
  
  // Re-renders компонентов
  componentRenders: {
    total: number;
    components: Map<string, number>;
  };
  
  // RPC calls за сессию
  rpcCalls: {
    total: number;
    byType: Map<string, number>;
    errors: number;
  };
  
  // Cache hit rate для React Query
  reactQueryCache: {
    hits: number;
    misses: number;
    hitRate: number; // процент
  };
}

class MetricsMonitor {
  private metrics: PerformanceMetrics = {
    dbLatency: {
      current: 0,
      average: 0,
      max: 0,
      calls: 0,
      threshold: 100
    },
    localStorage: {
      currentSize: 0,
      limit: 1048576, // 1MB
      percentage: 0
    },
    componentRenders: {
      total: 0,
      components: new Map()
    },
    rpcCalls: {
      total: 0,
      byType: new Map(),
      errors: 0
    },
    reactQueryCache: {
      hits: 0,
      misses: 0,
      hitRate: 0
    }
  };

  private latencySum = 0;
  private listeners: Set<(metrics: PerformanceMetrics) => void> = new Set();

  // DB Latency tracking
  trackDBRequest(operationType: string, latency: number) {
    this.metrics.dbLatency.current = latency;
    this.metrics.dbLatency.calls++;
    this.latencySum += latency;
    this.metrics.dbLatency.average = this.latencySum / this.metrics.dbLatency.calls;
    this.metrics.dbLatency.max = Math.max(this.metrics.dbLatency.max, latency);

    // Track RPC call
    this.trackRPCCall(operationType);

    this.notify();
  }

  // LocalStorage size tracking
  updateLocalStorageSize() {
    let totalSize = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        totalSize += localStorage[key].length + key.length;
      }
    }
    this.metrics.localStorage.currentSize = totalSize;
    this.metrics.localStorage.percentage = (totalSize / this.metrics.localStorage.limit) * 100;
    
    // Предупреждение если превышен лимит
    if (this.metrics.localStorage.percentage > 80) {
      console.warn('⚠️ localStorage использует более 80% лимита:', {
        current: `${(totalSize / 1024).toFixed(2)}KB`,
        limit: `${(this.metrics.localStorage.limit / 1024).toFixed(2)}KB`
      });
    }
    
    this.notify();
  }

  // Component re-render tracking
  trackComponentRender(componentName: string) {
    this.metrics.componentRenders.total++;
    const count = this.metrics.componentRenders.components.get(componentName) || 0;
    this.metrics.componentRenders.components.set(componentName, count + 1);
    this.notify();
  }

  // RPC call tracking
  trackRPCCall(operationType: string, isError = false) {
    this.metrics.rpcCalls.total++;
    const count = this.metrics.rpcCalls.byType.get(operationType) || 0;
    this.metrics.rpcCalls.byType.set(operationType, count + 1);
    
    if (isError) {
      this.metrics.rpcCalls.errors++;
    }
    
    this.notify();
  }

  // React Query cache tracking
  trackCacheHit() {
    this.metrics.reactQueryCache.hits++;
    this.updateCacheHitRate();
    this.notify();
  }

  trackCacheMiss() {
    this.metrics.reactQueryCache.misses++;
    this.updateCacheHitRate();
    this.notify();
  }

  private updateCacheHitRate() {
    const total = this.metrics.reactQueryCache.hits + this.metrics.reactQueryCache.misses;
    this.metrics.reactQueryCache.hitRate = total > 0 
      ? (this.metrics.reactQueryCache.hits / total) * 100 
      : 0;
  }

  // Subscribe to metrics updates
  subscribe(listener: (metrics: PerformanceMetrics) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach(listener => listener(this.getMetrics()));
  }

  // Get current metrics
  getMetrics(): PerformanceMetrics {
    return {
      dbLatency: { ...this.metrics.dbLatency },
      localStorage: { ...this.metrics.localStorage },
      componentRenders: {
        total: this.metrics.componentRenders.total,
        components: new Map(this.metrics.componentRenders.components),
      },
      rpcCalls: {
        total: this.metrics.rpcCalls.total,
        byType: new Map(this.metrics.rpcCalls.byType),
        errors: this.metrics.rpcCalls.errors,
      },
      reactQueryCache: { ...this.metrics.reactQueryCache },
    };
  }

  // Get metrics summary for logging
  getSummary() {
    return {
      'DB Latency (avg)': `${this.metrics.dbLatency.average.toFixed(2)}ms`,
      'DB Latency (max)': `${this.metrics.dbLatency.max.toFixed(2)}ms`,
      'DB Calls': this.metrics.dbLatency.calls,
      'LocalStorage Usage': `${(this.metrics.localStorage.currentSize / 1024).toFixed(2)}KB (${this.metrics.localStorage.percentage.toFixed(1)}%)`,
      'Total Renders': this.metrics.componentRenders.total,
      'RPC Calls': this.metrics.rpcCalls.total,
      'RPC Errors': this.metrics.rpcCalls.errors,
      'Cache Hit Rate': `${this.metrics.reactQueryCache.hitRate.toFixed(1)}%`
    };
  }

  // Reset metrics (useful for testing or new sessions)
  reset() {
    this.metrics = {
      dbLatency: {
        current: 0,
        average: 0,
        max: 0,
        calls: 0,
        threshold: 100
      },
      localStorage: {
        currentSize: 0,
        limit: 1048576,
        percentage: 0
      },
      componentRenders: {
        total: 0,
        components: new Map()
      },
      rpcCalls: {
        total: 0,
        byType: new Map(),
        errors: 0
      },
      reactQueryCache: {
        hits: 0,
        misses: 0,
        hitRate: 0
      }
    };
    this.latencySum = 0;
    this.notify();
  }
}

export const metricsMonitor = new MetricsMonitor();

// Периодическое обновление размера localStorage
if (typeof window !== 'undefined') {
  setInterval(() => {
    metricsMonitor.updateLocalStorageSize();
  }, 5000); // каждые 5 секунд
}
