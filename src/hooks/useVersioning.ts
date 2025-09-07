import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

interface VersionConflictError extends Error {
  name: 'VersionConflictError';
  currentVersion: number;
  expectedVersion: number;
  conflictData: any;
}

export const useVersioning = () => {
  const { toast } = useToast();

  const handleVersionConflict = useCallback(async (
    tableName: string,
    recordId: string,
    expectedVersion: number,
    newData: any,
    onResolved?: (mergedData: any) => void
  ) => {
    try {
      // Пытаемся разрешить конфликт через серверную функцию
      const { data: resolvedData, error } = await supabase.rpc('resolve_version_conflict', {
        p_table_name: tableName,
        p_record_id: recordId,
        p_expected_version: expectedVersion,
        p_new_data: newData
      });

      if (error) throw error;

      // Показываем уведомление о конфликте
      toast({
        title: "Конфликт версий обнаружен",
        description: "Данные были автоматически объединены с последней версией",
        variant: "default"
      });

      // Вызываем callback с объединенными данными
      onResolved?.(resolvedData);
      
      return resolvedData;
    } catch (error) {
      console.error('Failed to resolve version conflict:', error);
      toast({
        title: "Ошибка разрешения конфликта",
        description: "Не удалось объединить изменения. Попробуйте обновить страницу.",
        variant: "destructive"
      });
      throw error;
    }
  }, [toast]);

  const updateWithVersionCheck = useCallback(async (
    tableName: 'game_data' | 'marketplace_listings',
    recordId: string,
    updates: any,
    currentVersion: number
  ) => {
    try {
      // Добавляем проверку версии к обновлению
      const updateData = {
        ...updates,
        version: currentVersion + 1
      };

      const { data, error } = await (supabase as any)
        .from(tableName)
        .update(updateData)
        .eq('id', recordId)
        .eq('version', currentVersion) // Условие для проверки версии
        .select()
        .single();

      if (error) {
        // Проверяем, является ли это конфликтом версий
        if (error.message?.includes('version') || error.code === '23P01') {
          // Получаем текущую версию
          const { data: currentData } = await (supabase as any)
            .from(tableName)
            .select('version')
            .eq('id', recordId)
            .single();

          if (currentData) {
            const conflictError = new Error('Version conflict detected') as VersionConflictError;
            conflictError.name = 'VersionConflictError';
            conflictError.currentVersion = currentData.version;
            conflictError.expectedVersion = currentVersion;
            conflictError.conflictData = updates;
            throw conflictError;
          }
        }
        throw error;
      }

      return data;
    } catch (error) {
      if ((error as VersionConflictError).name === 'VersionConflictError') {
        // Автоматически пытаемся разрешить конфликт
        const resolved = await handleVersionConflict(
          tableName,
          recordId,
          (error as VersionConflictError).expectedVersion,
          (error as VersionConflictError).conflictData
        );
        
        // Повторяем попытку обновления с объединенными данными
        return await updateWithVersionCheck(
          tableName,
          recordId,
          resolved,
          (error as VersionConflictError).currentVersion
        );
      }
      throw error;
    }
  }, [handleVersionConflict]);

  const getRecordVersion = useCallback(async (tableName: 'game_data' | 'marketplace_listings', recordId: string) => {
    const { data, error } = await (supabase as any)
      .from(tableName)
      .select('version')
      .eq('id', recordId)
      .single();

    if (error) throw error;
    return data?.version || 1;
  }, []);

  return {
    handleVersionConflict,
    updateWithVersionCheck,
    getRecordVersion
  };
};