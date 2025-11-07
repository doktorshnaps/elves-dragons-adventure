// Re-export monitored Supabase client as the default client
// This allows all existing imports to automatically use the monitored version
export { monitoredSupabase as supabase } from './monitoredClient';
export * from './types';
