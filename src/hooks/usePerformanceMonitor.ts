import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';

interface PerformanceMetrics {
  fps: number;
  memoryUsage: number;
  renderTime: number;
  networkLatency: number;
  cacheHitRate: number;
}

interface PerformanceConfig {
  enableFPSMonitoring: boolean;
  enableMemoryMonitoring: boolean;
  enableRenderMonitoring: boolean;
  enableNetworkMonitoring: boolean;
  sampleInterval: number;
}

const defaultConfig: PerformanceConfig = {
  enableFPSMonitoring: true,
  enableMemoryMonitoring: true,
  enableRenderMonitoring: true,
  enableNetworkMonitoring: true,
  sampleInterval: 1000 // 1 second
};

export const usePerformanceMonitor = (config: Partial<PerformanceConfig> = {}) => {
  const finalConfig = { ...defaultConfig, ...config };
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 60,
    memoryUsage: 0,
    renderTime: 0,
    networkLatency: 0,
    cacheHitRate: 100
  });
  
  const frameCount = useRef(0);
  const lastTime = useRef(Date.now());
  const renderTimes = useRef<number[]>([]);
  const networkRequests = useRef<{ start: number; end?: number }[]>([]);
  const cacheStats = useRef({ hits: 0, misses: 0 });
  
  // FPS Monitoring
  useEffect(() => {
    if (!finalConfig.enableFPSMonitoring) return;
    
    let animationId: number;
    
    const measureFPS = () => {
      frameCount.current++;
      animationId = requestAnimationFrame(measureFPS);
    };
    
    animationId = requestAnimationFrame(measureFPS);
    
    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = now - lastTime.current;
      const fps = Math.round((frameCount.current * 1000) / elapsed);
      
      setMetrics(prev => ({ ...prev, fps }));
      
      frameCount.current = 0;
      lastTime.current = now;
    }, finalConfig.sampleInterval);
    
    return () => {
      cancelAnimationFrame(animationId);
      clearInterval(interval);
    };
  }, [finalConfig.enableFPSMonitoring, finalConfig.sampleInterval]);
  
  // Memory Monitoring
  useEffect(() => {
    if (!finalConfig.enableMemoryMonitoring || !('memory' in performance)) return;
    
    const interval = setInterval(() => {
      const memory = (performance as any).memory;
      if (memory) {
        const memoryUsage = Math.round(memory.usedJSHeapSize / 1024 / 1024); // MB
        setMetrics(prev => ({ ...prev, memoryUsage }));
      }
    }, finalConfig.sampleInterval);
    
    return () => clearInterval(interval);
  }, [finalConfig.enableMemoryMonitoring, finalConfig.sampleInterval]);
  
  // Network Latency Monitoring
  const startNetworkRequest = useCallback(() => {
    if (!finalConfig.enableNetworkMonitoring) return null;
    
    const requestId = Date.now();
    networkRequests.current.push({ start: requestId });
    return requestId;
  }, [finalConfig.enableNetworkMonitoring]);
  
  const endNetworkRequest = useCallback((requestId: number | null) => {
    if (!requestId || !finalConfig.enableNetworkMonitoring) return;
    
    const request = networkRequests.current.find(r => r.start === requestId);
    if (request) {
      request.end = Date.now();
      const latency = request.end - request.start;
      
      setMetrics(prev => ({ ...prev, networkLatency: latency }));
      
      // Clean old requests
      networkRequests.current = networkRequests.current
        .filter(r => r.end && Date.now() - r.end < 60000); // Keep last minute
    }
  }, [finalConfig.enableNetworkMonitoring]);
  
  // Render Time Monitoring
  const startRenderMeasure = useCallback((componentName: string) => {
    if (!finalConfig.enableRenderMonitoring) return null;
    
    performance.mark(`${componentName}-render-start`);
    return componentName;
  }, [finalConfig.enableRenderMonitoring]);
  
  const endRenderMeasure = useCallback((componentName: string | null) => {
    if (!componentName || !finalConfig.enableRenderMonitoring) return;
    
    try {
      performance.mark(`${componentName}-render-end`);
      performance.measure(
        `${componentName}-render`,
        `${componentName}-render-start`,
        `${componentName}-render-end`
      );
      
      const measure = performance.getEntriesByName(`${componentName}-render`)[0];
      if (measure) {
        renderTimes.current.push(measure.duration);
        
        // Keep only last 100 measurements
        if (renderTimes.current.length > 100) {
          renderTimes.current = renderTimes.current.slice(-100);
        }
        
        // Calculate average render time
        const avgRenderTime = renderTimes.current.reduce((a, b) => a + b, 0) / renderTimes.current.length;
        setMetrics(prev => ({ ...prev, renderTime: avgRenderTime }));
      }
      
      // Clean performance entries
      performance.clearMarks(`${componentName}-render-start`);
      performance.clearMarks(`${componentName}-render-end`);
      performance.clearMeasures(`${componentName}-render`);
    } catch (error) {
      console.warn('Performance measurement failed:', error);
    }
  }, [finalConfig.enableRenderMonitoring]);
  
  // Cache Hit Rate Monitoring
  const recordCacheHit = useCallback(() => {
    cacheStats.current.hits++;
    updateCacheHitRate();
  }, []);
  
  const recordCacheMiss = useCallback(() => {
    cacheStats.current.misses++;
    updateCacheHitRate();
  }, []);
  
  const updateCacheHitRate = useCallback(() => {
    const { hits, misses } = cacheStats.current;
    const total = hits + misses;
    const hitRate = total > 0 ? Math.round((hits / total) * 100) : 100;
    
    setMetrics(prev => ({ ...prev, cacheHitRate: hitRate }));
  }, []);
  
  // Performance warnings
  const warnings = useMemo(() => {
    const warnings: string[] = [];
    
    if (metrics.fps < 30) {
      warnings.push('Low FPS detected');
    }
    
    if (metrics.memoryUsage > 100) {
      warnings.push('High memory usage');
    }
    
    if (metrics.renderTime > 16) {
      warnings.push('Slow render times');
    }
    
    if (metrics.networkLatency > 1000) {
      warnings.push('High network latency');
    }
    
    if (metrics.cacheHitRate < 80) {
      warnings.push('Low cache hit rate');
    }
    
    return warnings;
  }, [metrics]);
  
  return {
    metrics,
    warnings,
    startNetworkRequest,
    endNetworkRequest,
    startRenderMeasure,
    endRenderMeasure,
    recordCacheHit,
    recordCacheMiss
  };
};

// HOC for automatic render time measurement
export const withPerformanceMonitoring = function<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName?: string
) {
  const MemoizedComponent = React.memo(WrappedComponent);
  
  return React.forwardRef<any, P>((props, ref) => {
    const { startRenderMeasure, endRenderMeasure } = usePerformanceMonitor();
    const name = componentName || WrappedComponent.displayName || WrappedComponent.name || 'Component';
    
    React.useLayoutEffect(() => {
      const measureId = startRenderMeasure(name);
      
      return () => {
        endRenderMeasure(measureId);
      };
    });
    
    return React.createElement(MemoizedComponent, { ...props, ref });
  });
};
