import { useState, useEffect } from 'react';
import { useMetricsMonitor } from '@/hooks/useMetricsMonitor';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { metricsMonitor } from '@/utils/metricsMonitor';
import { Activity, Database, HardDrive, RefreshCw, TrendingUp, X } from 'lucide-react';

export const MetricsPanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const metrics = useMetricsMonitor();

  // Горячая клавиша для открытия панели (Ctrl+Shift+M)
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'M') {
        setIsOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 rounded-full w-12 h-12 p-0"
        variant="outline"
        title="Открыть панель метрик (Ctrl+Shift+M)"
      >
        <Activity className="w-5 h-5" />
      </Button>
    );
  }

  const getLatencyColor = (latency: number) => {
    if (latency < 50) return 'text-green-500';
    if (latency < 100) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getStorageColor = (percentage: number) => {
    if (percentage < 50) return 'text-green-500';
    if (percentage < 80) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getCacheHitRateColor = (rate: number) => {
    if (rate > 70) return 'text-green-500';
    if (rate > 40) return 'text-yellow-500';
    return 'text-red-500';
  };

  // Топ-5 компонентов по количеству рендеров
  const topComponents = Array.from(metrics.componentRenders.components.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Топ-5 RPC вызовов
  const topRpcCalls = Array.from(metrics.rpcCalls.byType.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <Card className="fixed bottom-4 right-4 z-50 w-96 max-h-[600px] p-4 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          <h3 className="font-bold">Метрики производительности</h3>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => {
              metricsMonitor.reset();
              console.log('📊 Метрики сброшены');
            }}
            variant="ghost"
            size="sm"
            title="Сбросить метрики"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button
            onClick={() => setIsOpen(false)}
            variant="ghost"
            size="sm"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <ScrollArea className="h-[500px]">
        <div className="space-y-4">
          {/* DB Latency */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              <h4 className="font-semibold">База данных</h4>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Текущая задержка:</span>
                <p className={`font-mono ${getLatencyColor(metrics.dbLatency.current)}`}>
                  {metrics.dbLatency.current.toFixed(2)}ms
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Средняя:</span>
                <p className={`font-mono ${getLatencyColor(metrics.dbLatency.average)}`}>
                  {metrics.dbLatency.average.toFixed(2)}ms
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Максимальная:</span>
                <p className={`font-mono ${getLatencyColor(metrics.dbLatency.max)}`}>
                  {metrics.dbLatency.max.toFixed(2)}ms
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Запросов:</span>
                <p className="font-mono">{metrics.dbLatency.calls}</p>
              </div>
            </div>
            {metrics.dbLatency.average > metrics.dbLatency.threshold && (
              <Badge variant="destructive" className="text-xs">
                ⚠️ Превышен порог {metrics.dbLatency.threshold}ms
              </Badge>
            )}
          </div>

          {/* LocalStorage */}
          <div className="space-y-2 pt-4 border-t">
            <div className="flex items-center gap-2">
              <HardDrive className="w-4 h-4" />
              <h4 className="font-semibold">LocalStorage</h4>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Использовано:</span>
                <span className={`font-mono ${getStorageColor(metrics.localStorage.percentage)}`}>
                  {(metrics.localStorage.currentSize / 1024).toFixed(2)}KB / {(metrics.localStorage.limit / 1024).toFixed(2)}KB
                </span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all ${
                    metrics.localStorage.percentage > 80 ? 'bg-red-500' :
                    metrics.localStorage.percentage > 50 ? 'bg-yellow-500' :
                    'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(metrics.localStorage.percentage, 100)}%` }}
                />
              </div>
              <p className={`text-xs ${getStorageColor(metrics.localStorage.percentage)}`}>
                {metrics.localStorage.percentage.toFixed(1)}%
              </p>
            </div>
          </div>

          {/* Component Renders */}
          <div className="space-y-2 pt-4 border-t">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              <h4 className="font-semibold">Рендеры компонентов</h4>
            </div>
            <div className="text-sm">
              <div className="flex justify-between mb-2">
                <span className="text-muted-foreground">Всего рендеров:</span>
                <span className="font-mono">{metrics.componentRenders.total}</span>
              </div>
              {topComponents.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Топ-5 компонентов:</p>
                  {topComponents.map(([name, count]) => (
                    <div key={name} className="flex justify-between text-xs">
                      <span className="truncate max-w-[200px]" title={name}>{name}</span>
                      <span className="font-mono">{count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RPC Calls */}
          <div className="space-y-2 pt-4 border-t">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              <h4 className="font-semibold">RPC вызовы</h4>
            </div>
            <div className="space-y-2 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-muted-foreground">Всего:</span>
                  <p className="font-mono">{metrics.rpcCalls.total}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Ошибок:</span>
                  <p className="font-mono text-red-500">{metrics.rpcCalls.errors}</p>
                </div>
              </div>
              {topRpcCalls.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Топ-5 операций:</p>
                  {topRpcCalls.map(([name, count]) => (
                    <div key={name} className="flex justify-between text-xs">
                      <span className="truncate max-w-[200px]" title={name}>{name}</span>
                      <span className="font-mono">{count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* React Query Cache */}
          <div className="space-y-2 pt-4 border-t">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              <h4 className="font-semibold">React Query Cache</h4>
            </div>
            <div className="space-y-2 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-muted-foreground">Попадания:</span>
                  <p className="font-mono text-green-500">{metrics.reactQueryCache.hits}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Промахи:</span>
                  <p className="font-mono text-red-500">{metrics.reactQueryCache.misses}</p>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Hit Rate:</span>
                <span className={`font-mono text-lg font-bold ${getCacheHitRateColor(metrics.reactQueryCache.hitRate)}`}>
                  {metrics.reactQueryCache.hitRate.toFixed(1)}%
                </span>
              </div>
              {metrics.reactQueryCache.hitRate < 50 && metrics.reactQueryCache.misses > 10 && (
                <Badge variant="destructive" className="text-xs">
                  ⚠️ Низкий cache hit rate
                </Badge>
              )}
            </div>
          </div>
        </div>
      </ScrollArea>

      <div className="mt-4 pt-4 border-t text-xs text-muted-foreground">
        <p>Горячая клавиша: <kbd className="px-1 bg-secondary rounded">Ctrl+Shift+M</kbd></p>
      </div>
    </Card>
  );
};
