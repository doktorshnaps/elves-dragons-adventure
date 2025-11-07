import { useEffect, useRef } from 'react';
import { metricsMonitor } from '@/utils/metricsMonitor';

/**
 * Hook для автоматического отслеживания рендеров компонента
 * @param componentName - имя компонента для отслеживания
 */
export const useRenderTracking = (componentName: string) => {
  const renderCount = useRef(0);
  
  useEffect(() => {
    renderCount.current++;
    metricsMonitor.trackComponentRender(componentName);
  });
  
  return renderCount.current;
};
