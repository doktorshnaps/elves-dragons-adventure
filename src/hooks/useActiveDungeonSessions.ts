import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useWalletContext } from '@/contexts/WalletConnectContext';

interface ActiveDungeonSession {
  device_id: string;
  dungeon_type: string;
  level: number;
  last_activity: number;
  started_at: number;
  account_id: string;
}

/**
 * Централизованный хук для получения активных сессий подземелий
 * Использует агрессивное кэширование для предотвращения дублирующихся запросов
 */
export const useActiveDungeonSessions = () => {
  const { accountId } = useWalletContext();

  return useQuery<ActiveDungeonSession[]>({
    queryKey: ['activeDungeonSessions', accountId],
    queryFn: async () => {
      if (!accountId) return [];

      console.log('🔍 [useActiveDungeonSessions] Fetching from DB for:', accountId);
      const { data, error } = await supabase
        .from('active_dungeon_sessions')
        .select('*')
        .eq('account_id', accountId);

      if (error) {
        console.error('Error fetching active dungeon sessions:', error);
        return [];
      }

      console.log('✅ [useActiveDungeonSessions] Fetched', data?.length || 0, 'sessions');
      return data || [];
    },
    enabled: !!accountId,
    staleTime: 10 * 60 * 1000, // 10 минут - максимальное кеширование
    gcTime: 15 * 60 * 1000, // 15 минут
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
};

/**
 * Хук для получения последней активной сессии
 */
export const useLatestActiveDungeonSession = () => {
  const { accountId } = useWalletContext();

  return useQuery<Omit<ActiveDungeonSession, 'account_id'> | null>({
    queryKey: ['latestDungeonSession', accountId],
    queryFn: async () => {
      if (!accountId) return null;

      console.log('🔍 [useLatestActiveDungeonSession] Fetching from DB for:', accountId);
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
      const { data, error } = await supabase
        .from('active_dungeon_sessions')
        .select('device_id,dungeon_type,level,last_activity,started_at')
        .eq('account_id', accountId)
        .gte('last_activity', fiveMinutesAgo)
        .order('last_activity', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching latest dungeon session:', error);
        return null;
      }

      console.log('✅ [useLatestActiveDungeonSession] Fetched session:', data ? 'found' : 'none');
      return data;
    },
    enabled: !!accountId,
    staleTime: 10 * 60 * 1000, // 10 минут - максимальное кеширование
    gcTime: 15 * 60 * 1000, // 15 минут
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
};
