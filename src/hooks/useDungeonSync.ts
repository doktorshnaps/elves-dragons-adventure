import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useWalletContext } from '@/contexts/WalletConnectContext';
import { useGameData } from './useGameData';
import { RealtimeChannel } from '@supabase/supabase-js';

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

  // Проверяем наличие активного подземелья из базы
  const checkActiveDungeon = useCallback(async (): Promise<ActiveDungeonSession | null> => {
    if (!accountId || !gameData.battleState) return null;

    const currentSession: ActiveDungeonSession = {
      device_id: deviceId,
      started_at: Date.now(),
      last_activity: Date.now(),
      dungeon_type: gameData.battleState.selectedDungeon || 'unknown',
      level: gameData.battleState.currentDungeonLevel || 1
    };

    return currentSession;
  }, [accountId, gameData.battleState, deviceId]);

  // Отправляем heartbeat для активной сессии
  const sendHeartbeat = useCallback(async () => {
    if (!accountId) return;

    // Берем данные активной сессии из локального состояния, 
    // если его нет — пробуем из battleState (для обратной совместимости)
    const baseSession: ActiveDungeonSession | null = localSession
      ? { ...localSession }
      : (gameData.battleState
          ? {
              device_id: deviceId,
              started_at: Date.now(),
              last_activity: Date.now(),
              dungeon_type: gameData.battleState.selectedDungeon || 'unknown',
              level: gameData.battleState.currentDungeonLevel || 1
            }
          : null);

    if (!baseSession) return;

    const session: ActiveDungeonSession = {
      ...baseSession,
      last_activity: Date.now(),
    };

    // Отправляем через realtime channel
    const channel = supabase.channel(`dungeon_sync_${accountId}`);
    await channel.send({
      type: 'broadcast',
      event: 'heartbeat',
      payload: session
    });
  }, [accountId, deviceId, gameData.battleState, localSession]);

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

    // Чистим состояние боя в базе (на всякий случай)
    try {
      await updateGameData({ battleState: null });
    } catch {}

    const channel = supabase.channel(`dungeon_sync_${accountId}`);
    await channel.send({
      type: 'broadcast',
      event: 'end_session',
      payload: { device_id: deviceId }
    });
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

    const channel = supabase.channel(`dungeon_sync_${accountId}`);
    await channel.send({
      type: 'broadcast',
      event: 'start_session',
      payload: session
    });

    return true;
  }, [accountId, deviceId, hasOtherActiveSessions]);

  // Подписываемся на обновления от других устройств
  useEffect(() => {
    if (!accountId) return;

    let channel: RealtimeChannel;

    const setupChannel = async () => {
      channel = supabase.channel(`dungeon_sync_${accountId}`)
        .on('broadcast', { event: 'heartbeat' }, ({ payload }) => {
          setActiveSessions(prev => {
            const filtered = prev.filter(s => s.device_id !== payload.device_id);
            return [...filtered, payload as ActiveDungeonSession];
          });
        })
        .on('broadcast', { event: 'start_session' }, ({ payload }) => {
          setActiveSessions(prev => {
            const filtered = prev.filter(s => s.device_id !== payload.device_id);
            return [...filtered, payload as ActiveDungeonSession];
          });
        })
        .on('broadcast', { event: 'end_session' }, ({ payload }) => {
          setActiveSessions(prev => 
            prev.filter(s => s.device_id !== payload.device_id)
          );
        })
        .subscribe();
    };

    setupChannel();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [accountId]);

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
