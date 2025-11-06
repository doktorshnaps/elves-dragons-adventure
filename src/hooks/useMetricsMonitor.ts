import React, { useEffect, useState } from 'react';
import { metricsMonitor, PerformanceMetrics } from '@/utils/metricsMonitor';

export const useMetricsMonitor = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>(metricsMonitor.getMetrics());

  useEffect(() => {
    const unsubscribe = metricsMonitor.subscribe(setMetrics);
    return () => {
      unsubscribe();
    };
  }, []);

  return metrics;
};

// HOC для отслеживания re-renders компонентов
export function withRenderTracking<P extends object>(
  Component: React.ComponentType<P>,
  componentName?: string
): React.ComponentType<P> {
  const WrappedComponent: React.FC<P> = (props: P) => {
    const name = componentName || Component.displayName || Component.name || 'Unknown';
    
    useEffect(() => {
      metricsMonitor.trackComponentRender(name);
    });

    return React.createElement(Component, props);
  };

  WrappedComponent.displayName = `WithRenderTracking(${componentName || Component.displayName || Component.name})`;
  
  return WrappedComponent;
}
