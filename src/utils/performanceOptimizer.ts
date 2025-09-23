// Performance optimization utility
import { gameCache } from './cacheStrategy';

// Throttle function for high-frequency events
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout | null = null;
  let lastExecTime = 0;
  
  return (...args: Parameters<T>) => {
    const currentTime = Date.now();
    
    if (currentTime - lastExecTime > delay) {
      func(...args);
      lastExecTime = currentTime;
    } else {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      timeoutId = setTimeout(() => {
        func(...args);
        lastExecTime = Date.now();
        timeoutId = null;
      }, delay - (currentTime - lastExecTime));
    }
  };
};

// Optimized state updates for React
export const batchStateUpdates = (updates: (() => void)[]): void => {
  // Use React's unstable_batchedUpdates if available
  if (typeof (window as any).React?.unstable_batchedUpdates === 'function') {
    (window as any).React.unstable_batchedUpdates(() => {
      updates.forEach(update => update());
    });
  } else {
    // Fallback: execute updates immediately
    updates.forEach(update => update());
  }
};

// Memory-efficient array operations
export const optimizedArrayOperations = {
  // Efficient array filtering with early termination
  filterWithLimit: <T>(
    array: T[],
    predicate: (item: T) => boolean,
    limit: number = Infinity
  ): T[] => {
    const result: T[] = [];
    for (let i = 0; i < array.length && result.length < limit; i++) {
      if (predicate(array[i])) {
        result.push(array[i]);
      }
    }
    return result;
  },
  
  // Efficient array search with caching
  findWithCache: <T>(
    array: T[],
    predicate: (item: T) => boolean,
    cacheKey?: string
  ): T | undefined => {
    if (cacheKey) {
      const cached = gameCache.get(`find_${cacheKey}`);
      if (cached !== null) return cached;
    }
    
    const result = array.find(predicate);
    
    if (cacheKey && result) {
      gameCache.set(`find_${cacheKey}`, result);
    }
    
    return result;
  },
  
  // Memory-efficient array mapping
  mapChunked: <T, R>(
    array: T[],
    mapper: (item: T) => R,
    chunkSize: number = 1000
  ): R[] => {
    const result: R[] = [];
    
    for (let i = 0; i < array.length; i += chunkSize) {
      const chunk = array.slice(i, i + chunkSize);
      const mappedChunk = chunk.map(mapper);
      result.push(...mappedChunk);
      
      // Allow other tasks to run between chunks
      if (i + chunkSize < array.length) {
        return new Promise(resolve => {
          setTimeout(() => {
            resolve(result.concat(
              optimizedArrayOperations.mapChunked(
                array.slice(i + chunkSize),
                mapper,
                chunkSize
              ) as R[]
            ));
          }, 0);
        }) as any;
      }
    }
    
    return result;
  }
};

// Optimized object operations
export const optimizedObjectOperations = {
  // Shallow comparison for object equality
  shallowEqual: (obj1: any, obj2: any): boolean => {
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
    
    if (keys1.length !== keys2.length) {
      return false;
    }
    
    for (const key of keys1) {
      if (obj1[key] !== obj2[key]) {
        return false;
      }
    }
    
    return true;
  },
  
  // Deep clone with performance optimization
  deepClone: <T>(obj: T): T => {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }
    
    if (obj instanceof Date) {
      return new Date(obj.getTime()) as any;
    }
    
    if (obj instanceof Array) {
      return obj.map(item => optimizedObjectOperations.deepClone(item)) as any;
    }
    
    if (typeof obj === 'object') {
      const cloned: any = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          cloned[key] = optimizedObjectOperations.deepClone(obj[key]);
        }
      }
      return cloned;
    }
    
    return obj;
  },
  
  // Memory-efficient object merging
  deepMerge: (target: any, ...sources: any[]): any => {
    if (!sources.length) return target;
    const source = sources.shift();
    
    if (isObject(target) && isObject(source)) {
      for (const key in source) {
        if (isObject(source[key])) {
          if (!target[key]) Object.assign(target, { [key]: {} });
          optimizedObjectOperations.deepMerge(target[key], source[key]);
        } else {
          Object.assign(target, { [key]: source[key] });
        }
      }
    }
    
    return optimizedObjectOperations.deepMerge(target, ...sources);
  }
};

// Helper function
const isObject = (item: any): boolean => {
  return item && typeof item === 'object' && !Array.isArray(item);
};

// DOM optimization utilities
export const domOptimizations = {
  // Efficient element selection with caching
  querySelector: (selector: string, useCache: boolean = true): Element | null => {
    const cacheKey = `dom_${selector}`;
    
    if (useCache) {
      const cached = gameCache.get(cacheKey);
      if (cached !== null) return cached;
    }
    
    const element = document.querySelector(selector);
    
    if (useCache && element) {
      gameCache.set(cacheKey, element);
    }
    
    return element;
  },
  
  // Batched DOM updates
  batchDOMUpdates: (updates: (() => void)[]): void => {
    // Use DocumentFragment for multiple DOM manipulations
    const fragment = document.createDocumentFragment();
    
    // Execute updates
    updates.forEach(update => update());
    
    // Force layout recalculation once
    document.body.offsetHeight;
  },
  
  // Intersection Observer with pooling
  createOptimizedIntersectionObserver: (
    callback: IntersectionObserverCallback,
    options?: IntersectionObserverInit
  ) => {
    const observerKey = JSON.stringify(options || {});
    const cached = gameCache.get(`observer_${observerKey}`);
    
    if (cached) {
      return cached;
    }
    
    const observer = new IntersectionObserver(callback, {
      rootMargin: '50px',
      threshold: [0, 0.1, 0.5, 1],
      ...options
    });
    
    gameCache.set(`observer_${observerKey}`, observer);
    return observer;
  }
};

// Animation optimization
export const animationOptimizations = {
  // RAF-based animations with automatic cleanup
  createAnimationLoop: (callback: (time: number) => boolean) => {
    let animationId: number;
    let isRunning = true;
    
    const loop = (time: number) => {
      if (!isRunning) return;
      
      const shouldContinue = callback(time);
      if (shouldContinue) {
        animationId = requestAnimationFrame(loop);
      } else {
        isRunning = false;
      }
    };
    
    animationId = requestAnimationFrame(loop);
    
    return {
      stop: () => {
        isRunning = false;
        if (animationId) {
          cancelAnimationFrame(animationId);
        }
      }
    };
  },
  
  // CSS transform optimization
  optimizedTransform: (element: HTMLElement, transforms: string[]) => {
    // Batch transform operations
    element.style.transform = transforms.join(' ');
    
    // Use will-change for better performance
    element.style.willChange = 'transform';
    
    // Clean up will-change after animation
    setTimeout(() => {
      element.style.willChange = 'auto';
    }, 100);
  }
};

// Export performance analyzer
export const analyzePerformance = () => {
  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  const paint = performance.getEntriesByType('paint');
  const memory = (performance as any).memory;
  
  return {
    loadTime: navigation ? navigation.loadEventEnd - navigation.loadEventStart : 0,
    domContentLoaded: navigation ? navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart : 0,
    firstPaint: paint.find(p => p.name === 'first-paint')?.startTime || 0,
    firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
    memoryUsage: memory ? {
      used: Math.round(memory.usedJSHeapSize / 1024 / 1024),
      total: Math.round(memory.totalJSHeapSize / 1024 / 1024),
      limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024)
    } : null,
    cacheStats: gameCache.getStats()
  };
};