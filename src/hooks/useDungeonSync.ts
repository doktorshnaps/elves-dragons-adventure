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
        const mapped = data.map(row => ({
          device_id: row.device_id,
          started_at: row.started_at,
          last_activity: row.last_activity,
          dungeon_type: row.dungeon_type,
          level: row.level
        }));
        setActiveSessions(mapped);

        // Если для текущего устройства нет актуальной записи, сбрасываем локальную сессию
        const TIMEOUT = 30000;
        const now = Date.now();
        const hasThisDevice = mapped.some(r => r.device_id === deviceId && (now - r.last_activity) < TIMEOUT);
        if (!hasThisDevice && localSession) {
          try {
            localStorage.removeItem('activeDungeonSession');
            // Синхронизируем и боевую часть, чтобы UI на устройстве очистился
            localStorage.removeItem('teamBattleState');
            localStorage.removeItem('activeBattleInProgress');
            localStorage.removeItem('battleState');
            setLocalSession(null);
            try { window.dispatchEvent(new CustomEvent('battleReset')); } catch {}
          } catch {}
        }
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
    } catch (error: any) {
      // Игнорируем ошибку о существующей активной сессии - это нормально при частых heartbeat
      if (!error?.message?.includes('Active dungeon session already exists')) {
        console.error('Error sending heartbeat:', error);
      }
    }
  }, [accountId, deviceId, localSession]);

  // Проверяем есть ли активные сессии с других устройств
  const hasOtherActiveSessions = useCallback(() => {
    const now = Date.now();
    const TIMEOUT = 30000; // 30 секунд без активности = сессия неактивна (синхронизировано с БД)

    return activeSessions.some(
      session => 
        session.device_id !== deviceId && 
        (now - session.last_activity) < TIMEOUT
    );
  }, [activeSessions, deviceId]);

  // Завершаем подземелье на текущем устройстве (и для аккаунта в целом)
  const endDungeonSession = useCallback(async () => {
    // Пытаемся определить аккаунт даже если контекст ещё не инициализировался
    const targetAccountId = accountId || localStorage.getItem('walletAddress');
    if (!targetAccountId) {
      console.warn('endDungeonSession: missing account id');
      return;
    }

    // Чистим локальную сессию и выключаем heartbeat в ЭТОМ табе
    try {
      localStorage.removeItem('activeDungeonSession');
      setLocalSession(null);
    } catch {}

    // Удаляем из базы данных все активные сессии для кошелька
    try {
      const { error } = await supabase
        .from('active_dungeon_sessions')
        .delete()
        .eq('account_id', targetAccountId);
      if (error) throw error;
    } catch (error) {
      console.error('Error ending dungeon session:', error);
    }

    // Чистим состояние боя в БД (на всякий случай)
    try {
      await updateGameData({ battleState: null });
    } catch {}
  }, [accountId, updateGameData]);

  // Начинаем новое подземелье и уведомляем другие устройства
  const startDungeonSession = useCallback(async (dungeonType: string, level: number) => {
    if (!accountId) return false;

    // Проверяем, нет ли активных сессий на других устройствах
    if (hasOtherActiveSessions()) {
      return false; // Блокируем начало нового подземелья
    }

    // Серверная проверка для избежания гонки
    try {
      const now = Date.now();
      const TIMEOUT = 30000; // 30 секунд
      const { data: existing, error: existingError } = await supabase
        .from('active_dungeon_sessions')
        .select('device_id,last_activity')
        .eq('account_id', accountId)
        .gte('last_activity', now - TIMEOUT)
        .limit(1);

      if (existingError) throw existingError;
      if (existing && existing.length > 0 && existing[0].device_id !== deviceId) {
        return false;
      }
    } catch (e) {
      console.error('Error during preflight session check:', e);
      return false;
    }

    const session: ActiveDungeonSession = {
      device_id: deviceId,
      started_at: Date.now(),
      last_activity: Date.now(),
      dungeon_type: dungeonType,
      level: level
    };

    // Сохраняем локально, чтобы слать heartbeat даже вне боя/экрана подземелья
    

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
    // После успешной записи в БД сохраняем локально, чтобы слать heartbeat
    try {
      localStorage.setItem('activeDungeonSession', JSON.stringify(session));
      setLocalSession(session);
    } catch {}

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
        async (payload: RealtimePostgresChangesPayload<any>) => {
          console.log('📡 Dungeon session change:', payload);
          
          // Если удалена любая сессия для этого аккаунта — гарантированно завершаем локальную
          if (payload.eventType === 'DELETE') {
            console.log('🛑 Session DELETE detected for account, forcing local stop & cleanup');
            try {
              localStorage.removeItem('activeDungeonSession');
              localStorage.removeItem('teamBattleState');
              localStorage.removeItem('activeBattleInProgress');
              localStorage.removeItem('battleState');
              setLocalSession(null);
              try { window.dispatchEvent(new CustomEvent('battleReset')); } catch {}
            } catch {}

            // Повторно удалим на сервере (на случай гонки с heartbeat), операция идемпотентна
            try {
              await supabase
                .from('active_dungeon_sessions')
                .delete()
                .eq('account_id', accountId);
            } catch (e) {
              console.warn('Retry delete after DELETE event failed:', e);
            }
          }
          
          // Перезагружаем все сессии при любом изменении
          loadActiveSessions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [accountId, deviceId, loadActiveSessions]);

  // Отправляем heartbeat каждые 10 секунд (чтобы избежать конфликтов с БД)
  useEffect(() => {
    if (!localSession) return;

    const interval = setInterval(sendHeartbeat, 10000);
    sendHeartbeat(); // Отправляем сразу

    return () => clearInterval(interval);
  }, [localSession, sendHeartbeat]);

  // Очищаем устаревшие сессии
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const TIMEOUT = 30000; // держим 30с окно, чтобы совпадало с триггером БД

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
