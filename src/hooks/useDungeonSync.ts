import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useWalletContext } from '@/contexts/WalletConnectContext';
import { useGameData } from './useGameData';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { useActiveDungeonSessions } from './useActiveDungeonSessions';
import { useToast } from './use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { useGameEvents } from '@/contexts/GameEventsContext';
import { useGameStore } from '@/stores/gameStore';

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
  const queryClient = useQueryClient();
  const { emit } = useGameEvents();
  
  // Используем React Query хук вместо прямых запросов к БД
  const { data: queriedSessions = [] } = useActiveDungeonSessions();
  const [activeSessions, setActiveSessions] = useState<ActiveDungeonSession[]>([]);
  const [currentClaimKey, setCurrentClaimKey] = useState<string | null>(() => {
    return localStorage.getItem('currentClaimKey');
  });
  
  // 🔒 Guard: prevents cleanup from wiping claimKey while a claim is in progress
  const claimInProgressRef = useRef(false);
  
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
        // 🔒 Don't clear claimKey if claim is in progress
        if (!claimInProgressRef.current) {
          localStorage.removeItem('currentClaimKey');
          setCurrentClaimKey(null);
        }
        // Очищаем Zustand вместо localStorage для battle state
        const { clearTeamBattleState, clearBattleState } = useGameStore.getState();
        clearTeamBattleState();
        clearBattleState();
        setLocalSession(null);
        // Используем GameEventsContext вместо window.dispatchEvent
        emit('battleReset');
      } catch {}
    }
  }, [accountId, deviceId, localSession, activeSessions, emit]);

  // ❌ REMOVED: Heartbeat через клиент (блокируется RLS)
  // Сессия создается и обновляется только через Edge Functions

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
  const endDungeonSession = useCallback(async (endAllDevices: boolean = true) => {
    // Пытаемся определить аккаунт даже если контекст ещё не инициализировался
    const targetAccountId = accountId || localStorage.getItem('walletAddress');
    if (!targetAccountId) {
      console.warn('endDungeonSession: missing account id');
      return;
    }

    // Чистим локальную сессию и выключаем heartbeat в ЭТОМ табе
    // 🔒 НЕ очищаем currentClaimKey здесь — он нужен для claim rewards
    try {
      localStorage.removeItem('activeDungeonSession');
      setLocalSession(null);
    } catch {}

    // Удаляем сессию через Edge Function (RLS блокирует прямые удаления)
    try {
      const body: { wallet_address: string; device_id?: string } = { 
        wallet_address: targetAccountId
      };
      
      // Если endAllDevices = false, удаляем только текущее устройство
      if (!endAllDevices) {
        body.device_id = deviceId;
      }
      
      const { error } = await supabase.functions.invoke('end-dungeon-session', { body });
      if (error) {
        console.error('Error ending dungeon session:', error);
      }
    } catch (error) {
      console.error('Error calling end-dungeon-session:', error);
    }

    // Чистим состояние боя в БД (на всякий случай)
    try {
      await updateGameData({ battleState: null });
    } catch {}
  }, [accountId, deviceId, updateGameData]);

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

      // КРИТИЧНО: Инвалидируем кэш активных сессий, чтобы компоненты получили свежие данные
      await queryClient.invalidateQueries({ queryKey: ['activeDungeonSessions', accountId] });
      console.log('🔄 [useDungeonSync] Invalidated activeDungeonSessions cache');

      // 🔒 КРИТИЧНО: Устанавливаем флаг "сессия только что создана" для предотвращения ложного срабатывания проверки
      // Race condition: SELECT может вернуть 0 сессий до того, как данные реплицировались
      localStorage.setItem('sessionJustCreated', Date.now().toString());

      return true;
    } catch (err) {
      console.error('❌ [useDungeonSync] Unexpected error:', err);
      return false;
    }
  }, [accountId, deviceId, hasOtherActiveSessions, toast, queryClient]);

  // 🔄 Обновляем уровень и last_activity через Edge Function (RLS блокирует прямые обновления)
  const updateDungeonLevel = useCallback(async (level: number) => {
    if (!accountId) return false;

    try {
      console.log('🔄 [useDungeonSync] Updating dungeon level via Edge Function:', {
        accountId: accountId.substring(0, 10),
        level,
        deviceId: deviceId.substring(0, 20)
      });

      const { data, error } = await supabase.functions.invoke('update-dungeon-session', {
        body: {
          wallet_address: accountId,
          device_id: deviceId,
          level
        }
      });

      if (error) {
        console.error('❌ [useDungeonSync] Error updating session level:', error);
        return false;
      }

      console.log('✅ [useDungeonSync] Session level updated:', data);

      // Обновляем локальную сессию
      if (localSession) {
        const updatedSession = { ...localSession, level, last_activity: Date.now() };
        try {
          localStorage.setItem('activeDungeonSession', JSON.stringify(updatedSession));
          setLocalSession(updatedSession);
        } catch {}
      }

      return true;
    } catch (err) {
      console.error('❌ [useDungeonSync] Unexpected error updating level:', err);
      return false;
    }
  }, [accountId, deviceId, localSession]);

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
              // 🔒 Don't clear claimKey if claim is in progress
              if (!claimInProgressRef.current) {
                localStorage.removeItem('currentClaimKey');
                setCurrentClaimKey(null);
              }
              // Очищаем Zustand вместо localStorage для battle state
              const { clearTeamBattleState, clearBattleState } = useGameStore.getState();
              clearTeamBattleState();
              clearBattleState();
              setLocalSession(null);
              // Используем GameEventsContext вместо window.dispatchEvent
              emit('battleReset');
            } catch {}

            // Сессия уже удалена - повторное удаление не требуется
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
  }, [accountId, emit]);

  // ❌ REMOVED: Heartbeat disabled (RLS blocks client-side updates)

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

  // Проверяем есть ли ЛЮБАЯ активная сессия (включая текущее устройство)
  const hasAnyActiveSession = useCallback(() => {
    const now = Date.now();
    const TIMEOUT = 300000; // 5 минут без активности = сессия неактивна
    return activeSessions.some(session => (now - session.last_activity) < TIMEOUT);
  }, [activeSessions]);

  return {
    hasOtherActiveSessions: hasOtherActiveSessions(),
    hasAnyActiveSession: hasAnyActiveSession(),
    activeSessions: activeSessions.filter(s => s.device_id !== deviceId),
    allActiveSessions: activeSessions,
    startDungeonSession,
    endDungeonSession,
    updateDungeonLevel,
    deviceId,
    getCurrentClaimKey: () => currentClaimKey || localStorage.getItem('currentClaimKey'),
    setClaimInProgress: (v: boolean) => { claimInProgressRef.current = v; }
  };
};