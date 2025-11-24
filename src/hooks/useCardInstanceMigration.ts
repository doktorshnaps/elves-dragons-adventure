import { useEffect, useRef } from 'react';
import { useGameData } from './useGameData';
import { useCardInstances } from './useCardInstances';
import { useWalletContext } from '@/contexts/WalletConnectContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Hook для автоматической миграции карт из game_data.cards в card_instances
 * Запускается один раз при обнаружении несоответствия
 */
export const useCardInstanceMigration = () => {
  const { gameData } = useGameData();
  const { cardInstances } = useCardInstances();
  const { accountId } = useWalletContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const hasMigratedRef = useRef(false);
  const isMigratingRef = useRef(false);

  useEffect(() => {
    if (!accountId || !gameData || hasMigratedRef.current || isMigratingRef.current) return;

    const cardsInJson = Array.isArray(gameData.cards) ? gameData.cards : [];
    const heroesAndDragonsInJson = cardsInJson.filter(
      (c: any) => ['character', 'pet', 'hero', 'dragon'].includes(c.type)
    );
    const heroesAndDragonsInDB = cardInstances.filter(
      ci => ['character', 'pet', 'hero', 'dragon'].includes(ci.card_type as string)
    );

    const mismatch = heroesAndDragonsInJson.length - heroesAndDragonsInDB.length;

    console.log('🔍 [useCardInstanceMigration] Checking card instances:', {
      cardsInJson: heroesAndDragonsInJson.length,
      cardsInDB: heroesAndDragonsInDB.length,
      mismatch: mismatch
    });

    // Если есть несоответствие (больше 5 карт не синхронизировано), запускаем миграцию
    if (mismatch > 5) {
      console.log('🚨 [useCardInstanceMigration] Detected significant mismatch! Starting migration...');
      isMigratingRef.current = true;

      toast({
        title: '🔄 Синхронизация',
        description: `Обнаружено ${mismatch} несинхронизированных карт. Выполняется миграция...`,
      });

      supabase.functions
        .invoke('migrate-cards-to-instances', {
          body: { wallet_address: accountId }
        })
        .then(({ data, error }) => {
          if (error) {
            console.error('❌ [useCardInstanceMigration] Migration failed:', error);
            toast({
              title: '❌ Ошибка миграции',
              description: 'Не удалось синхронизировать карты с базой данных',
              variant: 'destructive'
            });
            return;
          }

          console.log('✅ [useCardInstanceMigration] Migration successful:', data);
          hasMigratedRef.current = true;

          // Инвалидируем кеш для обновления данных
          queryClient.invalidateQueries({ queryKey: ['cardInstances', accountId] });

          toast({
            title: '✅ Синхронизация завершена',
            description: `Синхронизировано карт: ${data.inserted_count}, пропущено: ${data.skipped_count}`,
          });
        })
        .finally(() => {
          isMigratingRef.current = false;
        });
    }
  }, [accountId, gameData, cardInstances, toast, queryClient]);
};
