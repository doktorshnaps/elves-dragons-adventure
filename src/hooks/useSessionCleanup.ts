import { supabase } from '@/integrations/supabase/client';

/**
 * Hook для административной очистки старых сессий подземелий
 * 
 * NOTE: В production это не требуется - автоматическая очистка
 * происходит через database trigger при каждой новой сессии.
 * 
 * Этот hook полезен только для:
 * - Административных панелей
 * - Debugging
 * - Manual maintenance
 */
export const useSessionCleanup = () => {
  /**
   * Ручная очистка сессий с дефолтным периодом (24 часа)
   */
  const cleanupOldSessions = async (): Promise<number | null> => {
    try {
      const { data, error } = await supabase.rpc('cleanup_old_dungeon_sessions');
      
      if (error) {
        console.error('❌ Error cleaning up sessions:', error);
        return null;
      }
      
      console.log(`✅ Cleaned up ${data} old sessions`);
      return data as number;
    } catch (err) {
      console.error('💥 Unexpected error during cleanup:', err);
      return null;
    }
  };

  /**
   * Ручная очистка сессий с кастомным периодом
   * @param hoursThreshold Количество часов (default: 24)
   */
  const cleanupSessionsByAge = async (hoursThreshold: number = 24): Promise<{
    deleted_count: number;
    cutoff_time: string;
  } | null> => {
    try {
      const { data, error } = await supabase.rpc('cleanup_dungeon_sessions_by_age', {
        p_hours_threshold: hoursThreshold
      });
      
      if (error) {
        console.error('❌ Error cleaning up sessions by age:', error);
        return null;
      }
      
      if (!data || data.length === 0) {
        console.log('ℹ️ No data returned from cleanup');
        return null;
      }
      
      const result = data[0];
      console.log(`✅ Cleaned up ${result.deleted_count} sessions older than ${hoursThreshold}h`);
      
      return {
        deleted_count: result.deleted_count,
        cutoff_time: result.cutoff_time
      };
    } catch (err) {
      console.error('💥 Unexpected error during cleanup by age:', err);
      return null;
    }
  };

  /**
   * Получить статистику по активным сессиям
   */
  const getSessionStats = async (): Promise<{
    total: number;
    old_sessions: number;
  } | null> => {
    try {
      // Общее количество сессий
      const { count: total, error: totalError } = await supabase
        .from('active_dungeon_sessions')
        .select('*', { count: 'exact', head: true });

      if (totalError) {
        console.error('❌ Error fetching total sessions:', totalError);
        return null;
      }

      // Количество старых сессий (>24 часа)
      const cutoffTime = new Date();
      cutoffTime.setHours(cutoffTime.getHours() - 24);
      
      const { count: oldSessions, error: oldError } = await supabase
        .from('active_dungeon_sessions')
        .select('*', { count: 'exact', head: true })
        .lt('created_at', cutoffTime.toISOString());

      if (oldError) {
        console.error('❌ Error fetching old sessions:', oldError);
        return null;
      }

      return {
        total: total || 0,
        old_sessions: oldSessions || 0
      };
    } catch (err) {
      console.error('💥 Unexpected error fetching session stats:', err);
      return null;
    }
  };

  return {
    cleanupOldSessions,
    cleanupSessionsByAge,
    getSessionStats
  };
};
