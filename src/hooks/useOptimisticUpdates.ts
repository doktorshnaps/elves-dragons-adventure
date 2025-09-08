import { useState, useCallback } from 'react';
import { GameData } from '@/types/gameState';

interface OptimisticState<T> {
  data: T;
  isOptimistic: boolean;
  timestamp: number;
}

export const useOptimisticUpdates = <T>(initialData: T) => {
  const [state, setState] = useState<OptimisticState<T>>({
    data: initialData,
    isOptimistic: false,
    timestamp: Date.now()
  });

  const [rollbackData, setRollbackData] = useState<T>(initialData);

  const optimisticUpdate = useCallback(async (
    newData: T,
    serverAction: () => Promise<T>
  ): Promise<void> => {
    // Сохраняем текущие данные для отката
    setRollbackData(state.data);
    
    // Сразу обновляем UI (оптимистично)
    setState({
      data: newData,
      isOptimistic: true,
      timestamp: Date.now()
    });

    try {
      // Выполняем серверное действие (но не обновляем состояние повторно)
      await serverAction();
      
      // Просто убираем флаг оптимистичности, оставляя данные как есть
      setState(prev => ({
        ...prev,
        isOptimistic: false
      }));
    } catch (error) {
      // Откатываемся к предыдущему состоянию
      setState({
        data: rollbackData,
        isOptimistic: false,
        timestamp: Date.now()
      });
      throw error;
    }
  }, [state.data, rollbackData]);

  const updateData = useCallback((newData: T) => {
    setState({
      data: newData,
      isOptimistic: false,
      timestamp: Date.now()
    });
  }, []);

  return {
    data: state.data,
    isOptimistic: state.isOptimistic,
    optimisticUpdate,
    updateData
  };
};