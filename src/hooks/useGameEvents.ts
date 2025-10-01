import { useGameEvents as useGameEventsContext, useGameEvent, GameEventType, GameEventPayload } from '@/contexts/GameEventsContext';

export { useGameEvent, type GameEventType, type GameEventPayload };

/**
 * Утилитарный хук для работы с игровыми событиями
 * Предоставляет удобные методы для emit/subscribe
 */
export const useGameEvents = () => {
  const events = useGameEventsContext();

  return {
    ...events,
    
    // Специфичные методы для частых случаев
    emitBalanceUpdate: (balance: number) => {
      events.emit('balanceUpdate', { balance });
    },
    
    emitCardsUpdate: (cards: any[]) => {
      events.emit('cardsUpdate', { cards });
    },
    
    emitInventoryUpdate: (inventory: any[]) => {
      events.emit('inventoryUpdate', { inventory });
    },
    
    emitEquipmentChange: (equipment: any) => {
      events.emit('equipmentChange', { equipment });
    },
    
    emitBattleReset: () => {
      events.emit('battleReset');
    },
    
    emitWalletChanged: (walletAddress: string) => {
      events.emit('wallet-changed', { walletAddress });
    },
    
    emitWalletDisconnected: () => {
      events.emit('wallet-disconnected');
    },
  };
};
