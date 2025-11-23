import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useWalletContext } from '@/contexts/WalletConnectContext';

interface ActiveDungeonSession {
  device_id: string;
  dungeon_type: string;
  level: number;
  last_activity: number;
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

      const { data, error } = await supabase
        .from('active_dungeon_sessions')
        .select('*')
        .eq('account_id', accountId);

      if (error) {
        console.error('Error fetching active dungeon sessions:', error);
        return [];
      }

      return data || [];
    },
    enabled: !!accountId,
    staleTime: 5 * 60 * 1000, // 5 минут - агрессивное кеширование для страницы выбора
    gcTime: 10 * 60 * 1000, // 10 минут
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

      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
      const { data, error } = await supabase
        .from('active_dungeon_sessions')
        .select('device_id,dungeon_type,level,last_activity')
        .eq('account_id', accountId)
        .gte('last_activity', fiveMinutesAgo)
        .order('last_activity', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching latest dungeon session:', error);
        return null;
      }

      return data;
    },
    enabled: !!accountId,
    staleTime: 5 * 60 * 1000, // 5 минут - агрессивное кеширование
    gcTime: 10 * 60 * 1000, // 10 минут
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
};
