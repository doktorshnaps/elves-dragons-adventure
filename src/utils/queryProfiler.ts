/**
 * Query Profiler для отслеживания N+1 queries и производительности
 */

interface QueryMetric {
  queryKey: string;
  timestamp: number;
  duration?: number;
  status: 'pending' | 'success' | 'error';
  stackTrace?: string;
}

class QueryProfiler {
  private metrics: Map<string, QueryMetric[]> = new Map();
  private enabled: boolean = true;
  private readonly DUPLICATE_THRESHOLD = 3; // Порог для детекции дубликатов
  private readonly TIME_WINDOW = 5000; // 5 секунд

  /**
   * Включить/выключить профилировщик
   */
  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    console.log(`🔍 [QueryProfiler] ${enabled ? 'Enabled' : 'Disabled'}`);
  }

  /**
   * Записать начало запроса
   */
  startQuery(queryKey: string): () => void {
    if (!this.enabled) return () => {};

    const metric: QueryMetric = {
      queryKey,
      timestamp: Date.now(),
      status: 'pending',
      stackTrace: this.captureStackTrace()
    };

    if (!this.metrics.has(queryKey)) {
      this.metrics.set(queryKey, []);
    }
    this.metrics.get(queryKey)!.push(metric);

    // Проверка на N+1 queries
    this.detectNPlusOne(queryKey);

    // Возвращаем функцию для завершения метрики
    return () => {
      metric.duration = Date.now() - metric.timestamp;
      metric.status = 'success';
    };
  }

  /**
   * Отметить ошибку запроса
   */
  errorQuery(queryKey: string) {
    if (!this.enabled) return;

    const queries = this.metrics.get(queryKey);
    if (queries && queries.length > 0) {
      queries[queries.length - 1].status = 'error';
    }
  }

  /**
   * Детекция N+1 queries
   */
  private detectNPlusOne(queryKey: string) {
    const now = Date.now();
    const queries = this.metrics.get(queryKey) || [];
    
    // Фильтруем запросы в пределах временного окна
    const recentQueries = queries.filter(q => now - q.timestamp < this.TIME_WINDOW);

    if (recentQueries.length >= this.DUPLICATE_THRESHOLD) {
      console.warn(
        `⚠️ [QueryProfiler] N+1 query detected: "${queryKey}"`,
        `\nCount: ${recentQueries.length} queries in ${this.TIME_WINDOW}ms`,
        `\nStack trace:`,
        recentQueries[0].stackTrace
      );
    }
  }

  /**
   * Получить статистику запросов
   */
  getStats() {
    const stats = Array.from(this.metrics.entries()).map(([queryKey, queries]) => {
      const successful = queries.filter(q => q.status === 'success');
      const failed = queries.filter(q => q.status === 'error');
      const avgDuration = successful.length > 0
        ? successful.reduce((sum, q) => sum + (q.duration || 0), 0) / successful.length
        : 0;

      return {
        queryKey,
        totalCalls: queries.length,
        successful: successful.length,
        failed: failed.length,
        avgDuration: Math.round(avgDuration),
        recentCalls: queries.filter(q => Date.now() - q.timestamp < this.TIME_WINDOW).length
      };
    });

    // Сортируем по количеству вызовов
    return stats.sort((a, b) => b.totalCalls - a.totalCalls);
  }

  /**
   * Вывести отчет в консоль
   */
  printReport() {
    console.group('📊 Query Profiler Report');
    
    const stats = this.getStats();
    
    console.log(`Total unique queries: ${stats.length}`);
    console.log('\nTop queries by call count:');
    
    console.table(
      stats.slice(0, 10).map(s => ({
        Query: s.queryKey,
        'Total Calls': s.totalCalls,
        'Recent (5s)': s.recentCalls,
        'Avg Duration (ms)': s.avgDuration,
        'Failed': s.failed
      }))
    );

    // Выявляем потенциальные N+1 queries
    const nPlusOneQueries = stats.filter(s => s.recentCalls >= this.DUPLICATE_THRESHOLD);
    if (nPlusOneQueries.length > 0) {
      console.warn('\n⚠️ Potential N+1 queries detected:');
      nPlusOneQueries.forEach(q => {
        console.warn(`  - ${q.queryKey}: ${q.recentCalls} calls in last 5s`);
      });
    }

    console.groupEnd();
  }

  /**
   * Очистить метрики
   */
  clear() {
    this.metrics.clear();
    console.log('🧹 [QueryProfiler] Metrics cleared');
  }

  /**
   * Захватить stack trace
   */
  private captureStackTrace(): string {
    const stack = new Error().stack || '';
    return stack.split('\n').slice(3, 6).join('\n'); // Берем 3 строки после этой функции
  }
}

// Singleton instance
export const queryProfiler = new QueryProfiler();

// Добавляем в window для доступа из консоли браузера
if (typeof window !== 'undefined') {
  (window as any).queryProfiler = queryProfiler;
}

/**
 * React Query plugin для автоматического профилирования
 */
export const queryProfilerPlugin = {
  onFetch: (query: any) => {
    const queryKey = JSON.stringify(query.queryKey);
    const finish = queryProfiler.startQuery(queryKey);
    
    // Возвращаем cleanup функцию
    return () => {
      finish();
      if (query.state.error) {
        queryProfiler.errorQuery(queryKey);
      }
    };
  }
};
