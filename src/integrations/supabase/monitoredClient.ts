// Обертка над Supabase клиентом для мониторинга latency
import { supabase } from './client';
import { metricsMonitor } from '@/utils/metricsMonitor';

// Обертка для RPC вызовов с отслеживанием latency
const originalRpc = supabase.rpc.bind(supabase);

supabase.rpc = function(fn: string, args?: any, options?: any) {
  const startTime = performance.now();
  const rpcCall = originalRpc(fn, args, options);
  
  // Отслеживаем latency после выполнения запроса
  rpcCall.then(
    (result) => {
      const latency = performance.now() - startTime;
      metricsMonitor.trackDBRequest(`rpc:${fn}`, latency);
      
      // Предупреждение если latency > 100ms
      if (latency > 100) {
        console.warn(`⚠️ Slow RPC call detected: ${fn} took ${latency.toFixed(2)}ms`);
      }
      
      return result;
    },
    (error) => {
      const latency = performance.now() - startTime;
      metricsMonitor.trackDBRequest(`rpc:${fn}`, latency);
      metricsMonitor.trackRPCCall(`rpc:${fn}`, true); // Track error
      throw error;
    }
  );
  
  return rpcCall;
} as any;

// Обертка для from() запросов
const originalFrom = supabase.from.bind(supabase);

supabase.from = function(table: string) {
  const builder = originalFrom(table);
  
  // Оборачиваем основные методы запросов
  const wrapQuery = (method: string, queryBuilder: any) => {
    const startTime = performance.now();
    return queryBuilder.then(
      (result: any) => {
        const latency = performance.now() - startTime;
        metricsMonitor.trackDBRequest(`${method}:${table}`, latency);
        
        if (latency > 100) {
          console.warn(`⚠️ Slow ${method} query on ${table}: ${latency.toFixed(2)}ms`);
        }
        
        return result;
      },
      (error: any) => {
        const latency = performance.now() - startTime;
        metricsMonitor.trackDBRequest(`${method}:${table}`, latency);
        metricsMonitor.trackRPCCall(`${method}:${table}`, true);
        throw error;
      }
    );
  };

  // Оборачиваем select, insert, update, delete, upsert
  const originalSelect = builder.select.bind(builder);
  builder.select = function(...args: any[]) {
    const query = originalSelect(...args);
    const originalThen = query.then;
    query.then = function(onFulfilled: any, onRejected: any) {
      return wrapQuery('select', originalThen.call(query, onFulfilled, onRejected));
    };
    return query;
  };

  const originalInsert = builder.insert.bind(builder);
  builder.insert = function(...args: any[]) {
    const query = originalInsert(...args);
    const originalThen = query.then;
    query.then = function(onFulfilled: any, onRejected: any) {
      return wrapQuery('insert', originalThen.call(query, onFulfilled, onRejected));
    };
    return query;
  };

  const originalUpdate = builder.update.bind(builder);
  builder.update = function(...args: any[]) {
    const query = originalUpdate(...args);
    const originalThen = query.then;
    query.then = function(onFulfilled: any, onRejected: any) {
      return wrapQuery('update', originalThen.call(query, onFulfilled, onRejected));
    };
    return query;
  };

  const originalDelete = builder.delete.bind(builder);
  builder.delete = function(...args: any[]) {
    const query = originalDelete(...args);
    const originalThen = query.then;
    query.then = function(onFulfilled: any, onRejected: any) {
      return wrapQuery('delete', originalThen.call(query, onFulfilled, onRejected));
    };
    return query;
  };

  const originalUpsert = builder.upsert.bind(builder);
  builder.upsert = function(...args: any[]) {
    const query = originalUpsert(...args);
    const originalThen = query.then;
    query.then = function(onFulfilled: any, onRejected: any) {
      return wrapQuery('upsert', originalThen.call(query, onFulfilled, onRejected));
    };
    return query;
  };

  return builder;
} as any;

export { supabase as monitoredSupabase };
