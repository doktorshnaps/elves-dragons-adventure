import React, { createContext, useContext, useCallback, useRef } from 'react';

/**
 * Типы игровых событий для замены window.dispatchEvent
 */
export type GameEventType =
  | 'balanceUpdate'
  | 'cardsUpdate'
  | 'cardsHealthUpdate'
  | 'inventoryUpdate'
  | 'equipmentChange'
  | 'battleReset'
  | 'startIncubation'
  | 'activeWorkers:changed'
  | 'cardInstanceHealthUpdate'
  | 'wallet-changed'
  | 'wallet-disconnected';

export interface GameEventPayload {
  balance?: number;
  cards?: any[];
  inventory?: any[];
  equipment?: any;
  walletAddress?: string;
  activeWorkers?: any[];
  [key: string]: any;
}

type GameEventListener = (payload?: GameEventPayload) => void;

interface GameEventsContextValue {
  emit: (eventType: GameEventType, payload?: GameEventPayload) => void;
  on: (eventType: GameEventType, listener: GameEventListener) => () => void;
  off: (eventType: GameEventType, listener: GameEventListener) => void;
  once: (eventType: GameEventType, listener: GameEventListener) => void;
}

const GameEventsContext = createContext<GameEventsContextValue | null>(null);

/**
 * Provider для управления игровыми событиями
 * Заменяет window.dispatchEvent/addEventListener на React Context
 */
export const GameEventsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const listeners = useRef<Map<GameEventType, Set<GameEventListener>>>(new Map());

  const emit = useCallback((eventType: GameEventType, payload?: GameEventPayload) => {
    const eventListeners = listeners.current.get(eventType);
    if (eventListeners) {
      console.log(`📢 [Events] Emitting ${eventType}:`, payload ? Object.keys(payload) : 'no payload');
      eventListeners.forEach((listener) => {
        try {
          listener(payload);
        } catch (error) {
          console.error(`❌ [Events] Error in listener for ${eventType}:`, error);
        }
      });
    }
  }, []);

  const on = useCallback((eventType: GameEventType, listener: GameEventListener) => {
    if (!listeners.current.has(eventType)) {
      listeners.current.set(eventType, new Set());
    }
    listeners.current.get(eventType)!.add(listener);

    console.log(`📝 [Events] Registered listener for ${eventType}`);

    // Возвращаем функцию для отписки
    return () => {
      off(eventType, listener);
    };
  }, []);

  const off = useCallback((eventType: GameEventType, listener: GameEventListener) => {
    const eventListeners = listeners.current.get(eventType);
    if (eventListeners) {
      eventListeners.delete(listener);
      console.log(`📝 [Events] Unregistered listener for ${eventType}`);
    }
  }, []);

  const once = useCallback((eventType: GameEventType, listener: GameEventListener) => {
    const onceListener: GameEventListener = (payload) => {
      listener(payload);
      off(eventType, onceListener);
    };
    on(eventType, onceListener);
  }, [on, off]);

  const value: GameEventsContextValue = {
    emit,
    on,
    off,
    once,
  };

  return <GameEventsContext.Provider value={value}>{children}</GameEventsContext.Provider>;
};

/**
 * Hook для использования игровых событий
 */
export const useGameEvents = () => {
  const context = useContext(GameEventsContext);
  if (!context) {
    throw new Error('useGameEvents must be used within GameEventsProvider');
  }
  return context;
};

/**
 * Hook для подписки на конкретное событие
 */
export const useGameEvent = (
  eventType: GameEventType,
  listener: GameEventListener,
  deps: React.DependencyList = []
) => {
  const { on } = useGameEvents();

  React.useEffect(() => {
    const unsubscribe = on(eventType, listener);
    return unsubscribe;
  }, [eventType, on, ...deps]);
};
