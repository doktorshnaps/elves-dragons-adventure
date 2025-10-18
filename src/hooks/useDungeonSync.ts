import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useWalletContext } from '@/contexts/WalletConnectContext';
import { useGameData } from './useGameData';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

interface ActiveDungeonSession {
  device_id: string;
  started_at: number;
  last_activity: number;
  dungeon_type: string;
  level: number;
}

export const useDungeonSync = () => {
  const { accountId } = useWalletContext();
  const { gameData, updateGameData } = useGameData();
  const [activeSessions, setActiveSessions] = useState<ActiveDungeonSession[]>([]);
  const [deviceId] = useState(() => {
    // Генерируем уникальный ID устройства или берем из localStorage
    let id = localStorage.getItem('device_id');
    if (!id) {
      id = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('device_id', id);
    }
    return id;
  });

  // Локальное состояние активной сессии подземелья для этого устройства
  const [localSession, setLocalSession] = useState<ActiveDungeonSession | null>(() => {
    try {
      const raw = localStorage.getItem('activeDungeonSession');
      return raw ? JSON.parse(raw) as ActiveDungeonSession : null;
    } catch {
      return null;
    }
  });

  // Синхронизация между вкладками/приложениями через событие storage
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'activeDungeonSession') {
        try {
          setLocalSession(e.newValue ? (JSON.parse(e.newValue) as ActiveDungeonSession) : null);
        } catch {
          setLocalSession(null);
        }
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // Загружаем активные сессии из базы данных при монтировании
  const loadActiveSessions = useCallback(async () => {
    if (!accountId) return;

    try {
      const { data, error } = await supabase
        .from('active_dungeon_sessions')
        .select('*')
        .eq('account_id', accountId);

      if (error) throw error;

      if (data) {
        setActiveSessions(data.map(row => ({
          device_id: row.device_id,
          started_at: row.started_at,
          last_activity: row.last_activity,
          dungeon_type: row.dungeon_type,
          level: row.level
        })));
      }
    } catch (error) {
      console.error('Error loading active sessions:', error);
    }
  }, [accountId]);

  // Отправляем heartbeat для активной сессии
  const sendHeartbeat = useCallback(async () => {
    if (!accountId || !localSession) return;

    const session: ActiveDungeonSession = {
      ...localSession,
      last_activity: Date.now(),
    };

    try {
      // Обновляем в базе данных
      await supabase
        .from('active_dungeon_sessions')
        .upsert({
          account_id: accountId,
          device_id: deviceId,
          dungeon_type: session.dungeon_type,
          level: session.level,
          started_at: session.started_at,
          last_activity: session.last_activity
        }, {
          onConflict: 'account_id,device_id'
        });
    } catch (error) {
      console.error('Error sending heartbeat:', error);
    }
  }, [accountId, deviceId, localSession]);

  // Проверяем есть ли активные сессии с других устройств
  const hasOtherActiveSessions = useCallback(() => {
    const now = Date.now();
    const TIMEOUT = 10000; // 10 секунд без активности = сессия неактивна

    return activeSessions.some(
      session => 
        session.device_id !== deviceId && 
        (now - session.last_activity) < TIMEOUT
    );
  }, [activeSessions, deviceId]);

  // Завершаем подземелье на текущем устройстве
  const endDungeonSession = useCallback(async () => {
    if (!accountId) return;

    // Чистим локальную сессию
    try {
      localStorage.removeItem('activeDungeonSession');
      setLocalSession(null);
    } catch {}

    // Удаляем из базы данных
    try {
      await supabase
        .from('active_dungeon_sessions')
        .delete()
        .eq('account_id', accountId)
        .eq('device_id', deviceId);
    } catch (error) {
      console.error('Error ending dungeon session:', error);
    }

    // Чистим состояние боя в базе (на всякий случай)
    try {
      await updateGameData({ battleState: null });
    } catch {}
  }, [accountId, deviceId, updateGameData]);

  // Начинаем новое подземелье и уведомляем другие устройства
  const startDungeonSession = useCallback(async (dungeonType: string, level: number) => {
    if (!accountId) return false;

    // Проверяем, нет ли активных сессий на других устройствах
    if (hasOtherActiveSessions()) {
      return false; // Блокируем начало нового подземелья
    }

    const session: ActiveDungeonSession = {
      device_id: deviceId,
      started_at: Date.now(),
      last_activity: Date.now(),
      dungeon_type: dungeonType,
      level: level
    };

    // Сохраняем локально, чтобы слать heartbeat даже вне боя/экрана подземелья
    try {
      localStorage.setItem('activeDungeonSession', JSON.stringify(session));
      setLocalSession(session);
    } catch {}

    // Сохраняем в базе данных
    try {
      await supabase
        .from('active_dungeon_sessions')
        .upsert({
          account_id: accountId,
          device_id: deviceId,
          dungeon_type: dungeonType,
          level: level,
          started_at: session.started_at,
          last_activity: session.last_activity
        }, {
          onConflict: 'account_id,device_id'
        });
    } catch (error) {
      console.error('Error starting dungeon session:', error);
      return false;
    }

    return true;
  }, [accountId, deviceId, hasOtherActiveSessions]);

  // Загружаем активные сессии при монтировании
  useEffect(() => {
    loadActiveSessions();
  }, [loadActiveSessions]);

  // Подписываемся на изменения в базе данных через Realtime
  useEffect(() => {
    if (!accountId) return;

    const channel = supabase
      .channel(`active_dungeon_sessions:${accountId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'active_dungeon_sessions',
          filter: `account_id=eq.${accountId}`
        },
        (payload: RealtimePostgresChangesPayload<any>) => {
          console.log('📡 Dungeon session change:', payload);
          // Перезагружаем все сессии при любом изменении
          loadActiveSessions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [accountId, loadActiveSessions]);

  // Отправляем heartbeat каждые 3 секунды
  useEffect(() => {
    if (!localSession) return;

    const interval = setInterval(sendHeartbeat, 3000);
    sendHeartbeat(); // Отправляем сразу

    return () => clearInterval(interval);
  }, [localSession, sendHeartbeat]);

  // Очищаем устаревшие сессии
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const TIMEOUT = 10000;

      setActiveSessions(prev => 
        prev.filter(session => (now - session.last_activity) < TIMEOUT)
      );
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return {
    hasOtherActiveSessions: hasOtherActiveSessions(),
    activeSessions: activeSessions.filter(s => s.device_id !== deviceId),
    startDungeonSession,
    endDungeonSession,
    deviceId
  };
};
