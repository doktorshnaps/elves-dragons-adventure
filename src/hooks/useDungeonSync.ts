import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useWalletContext } from '@/contexts/WalletConnectContext';
import { useGameData } from './useGameData';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { useActiveDungeonSessions } from './useActiveDungeonSessions';
import { useToast } from './use-toast';

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
  const { toast } = useToast();
  
  // Используем React Query хук вместо прямых запросов к БД
  const { data: queriedSessions = [] } = useActiveDungeonSessions();
  const [activeSessions, setActiveSessions] = useState<ActiveDungeonSession[]>([]);
  const [currentClaimKey, setCurrentClaimKey] = useState<string | null>(() => {
    return localStorage.getItem('currentClaimKey');
  });
  
  const [deviceId] = useState(() => {
    // Генерируем уникальный ID устройства или берем из localStorage
    let id = localStorage.getItem('device_id');
    if (!id) {
      id = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('device_id', id);
    }
    return id;
  });
  
  // Синхронизируем данные из React Query с локальным состоянием
  useEffect(() => {
    if (queriedSessions.length > 0) {
      setActiveSessions(queriedSessions.map(row => ({
        device_id: row.device_id,
        started_at: row.started_at,
        last_activity: row.last_activity,
        dungeon_type: row.dungeon_type,
        level: row.level
      })));
    }
  }, [queriedSessions]);

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

  // Проверяем локальную сессию против данных из React Query
  useEffect(() => {
    if (!accountId || activeSessions.length === 0) return;
    
    const TIMEOUT = 300000; // 5 минут для совместимости с проверкой в TeamBattlePage
    const now = Date.now();
    const hasThisDevice = activeSessions.some(r => r.device_id === deviceId && (now - r.last_activity) < TIMEOUT);
    
    if (!hasThisDevice && localSession) {
      try {
        localStorage.removeItem('activeDungeonSession');
        localStorage.removeItem('teamBattleState');
        localStorage.removeItem('activeBattleInProgress');
        localStorage.removeItem('battleState');
        localStorage.removeItem('currentClaimKey');
        setLocalSession(null);
        setCurrentClaimKey(null);
        try { window.dispatchEvent(new CustomEvent('battleReset')); } catch {}
      } catch {}
    }
  }, [accountId, deviceId, localSession, activeSessions]);

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
    const TIMEOUT = 300000; // 5 минут без активности = сессия неактивна

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
      localStorage.removeItem('currentClaimKey');
      setLocalSession(null);
      setCurrentClaimKey(null);
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

  // 🔒 Начинаем новое подземелье через Edge Function для серверной генерации claim_key
  const startDungeonSession = useCallback(async (dungeonType: string, level: number) => {
    if (!accountId) return false;

    // Проверяем, нет ли активных сессий на других устройствах
    if (hasOtherActiveSessions()) {
      return false; // Блокируем начало нового подземелья
    }

    try {
      console.log('🎮 [useDungeonSync] Starting dungeon session via Edge Function:', {
        accountId,
        dungeonType,
        level,
        deviceId
      });

      // 🔒 Вызываем новую Edge Function для серверной генерации claim_key
      const { data, error } = await supabase.functions.invoke('start-dungeon-session', {
        body: {
          wallet_address: accountId,
          dungeon_type: dungeonType,
          level: level,
          device_id: deviceId
        }
      });

      if (error) {
        console.error('❌ [useDungeonSync] Error starting session:', error);
        toast({
          title: "Ошибка",
          description: "Не удалось начать сессию подземелья",
          variant: "destructive"
        });
        return false;
      }

      if (!data?.claim_key) {
        console.error('❌ [useDungeonSync] No claim_key received from server');
        return false;
      }

      // Сохраняем claim_key для последующего клейма наград
      const claimKey = data.claim_key;
      setCurrentClaimKey(claimKey);
      localStorage.setItem('currentClaimKey', claimKey);
      console.log('✅ [useDungeonSync] Session started, claim_key saved:', claimKey.substring(0, 8));

      // Создаём локальную сессию
      const session: ActiveDungeonSession = {
        device_id: deviceId,
        started_at: Date.now(),
        last_activity: Date.now(),
        dungeon_type: dungeonType,
        level: level
      };

      // Сохраняем локально для heartbeat
      try {
        localStorage.setItem('activeDungeonSession', JSON.stringify(session));
        setLocalSession(session);
      } catch {}

      return true;
    } catch (err) {
      console.error('❌ [useDungeonSync] Unexpected error:', err);
      return false;
    }
  }, [accountId, deviceId, hasOtherActiveSessions, toast]);

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
              localStorage.removeItem('currentClaimKey');
              setLocalSession(null);
              setCurrentClaimKey(null);
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
          
          // Обновляем локальное состояние напрямую вместо перезагрузки
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const newSession = payload.new as any;
            setActiveSessions(prev => {
              const filtered = prev.filter(s => s.device_id !== newSession.device_id);
              return [...filtered, {
                device_id: newSession.device_id,
                started_at: newSession.started_at,
                last_activity: newSession.last_activity,
                dungeon_type: newSession.dungeon_type,
                level: newSession.level
              }];
            });
          } else if (payload.eventType === 'DELETE') {
            const oldSession = payload.old as any;
            setActiveSessions(prev => prev.filter(s => s.device_id !== oldSession.device_id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [accountId]);

  // Отправляем heartbeat каждые 60 секунд (оптимизация для снижения нагрузки во время боя)
  useEffect(() => {
    if (!localSession) return;

    const interval = setInterval(sendHeartbeat, 60000); // Увеличено с 10s до 60s
    sendHeartbeat(); // Отправляем сразу

    return () => clearInterval(interval);
  }, [localSession, sendHeartbeat]);

  // Очищаем устаревшие сессии
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const TIMEOUT = 300000; // 5 минут

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
    deviceId,
    getCurrentClaimKey: () => currentClaimKey || localStorage.getItem('currentClaimKey')
  };
};
