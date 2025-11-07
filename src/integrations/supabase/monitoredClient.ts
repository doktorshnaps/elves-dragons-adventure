// Обертка над Supabase клиентом для мониторинга latency
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { metricsMonitor } from '@/utils/metricsMonitor';

const SUPABASE_URL = "https://oimhwdymghkwxznjarkv.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9pbWh3ZHltZ2hrd3h6bmphcmt2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MTMxMjEsImV4cCI6MjA3MDA4OTEyMX0.97FbtgxM3nYtzTQWf8TpKqvxJ7h_pvhpBOd0SYRd05k";

const baseClient = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});

// Оборачиваем RPC вызовы
const originalRpc = baseClient.rpc.bind(baseClient);
baseClient.rpc = function(fn: string, args?: any, options?: any) {
  const startTime = performance.now();
  const promise = originalRpc(fn, args, options);
  
  promise.then(
    (result) => {
      const latency = performance.now() - startTime;
      metricsMonitor.trackDBRequest(`rpc:${fn}`, latency);
      if (latency > 100) {
        console.warn(`⚠️ Slow RPC: ${fn} (${latency.toFixed(2)}ms)`);
      }
      return result;
    },
    (error) => {
      const latency = performance.now() - startTime;
      metricsMonitor.trackDBRequest(`rpc:${fn}`, latency);
      metricsMonitor.trackRPCCall(`rpc:${fn}`, true);
      throw error;
    }
  );
  
  return promise;
} as any;

// Оборачиваем from() для SELECT/INSERT/UPDATE/DELETE
const originalFrom = baseClient.from.bind(baseClient);
baseClient.from = function(table: string) {
  const builder = originalFrom(table);
  
  // Функция для обертки promise
  const wrapPromise = (method: string, promise: any) => {
    const startTime = performance.now();
    
    const originalThen = promise.then.bind(promise);
    promise.then = function(onFulfilled?: any, onRejected?: any) {
      return originalThen(
        (result: any) => {
          const latency = performance.now() - startTime;
          metricsMonitor.trackDBRequest(`${method}:${table}`, latency);
          if (latency > 100) {
            console.warn(`⚠️ Slow ${method} on ${table}: ${latency.toFixed(2)}ms`);
          }
          return onFulfilled ? onFulfilled(result) : result;
        },
        (error: any) => {
          const latency = performance.now() - startTime;
          metricsMonitor.trackDBRequest(`${method}:${table}`, latency);
          metricsMonitor.trackRPCCall(`${method}:${table}`, true);
          if (onRejected) return onRejected(error);
          throw error;
        }
      );
    };
    
    return promise;
  };
  
  // Оборачиваем каждый метод
  const methods = ['select', 'insert', 'update', 'delete', 'upsert'];
  methods.forEach(method => {
    const original = (builder as any)[method];
    if (original) {
      (builder as any)[method] = function(...args: any[]) {
        const result = original.apply(builder, args);
        return wrapPromise(method, result);
      };
    }
  });
  
  return builder;
} as any;

export { baseClient as monitoredSupabase };
