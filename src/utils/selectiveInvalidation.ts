import { queryClient } from '@/config/reactQuery';

/**
 * Утилита для selective cache invalidation
 * Инвалидирует только те данные, которые реально изменились
 */

export interface InvalidationOptions {
  /** Инвалидировать баланс пользователя */
  balance?: boolean;
  /** Инвалидировать инвентарь предметов */
  itemInstances?: boolean;
  /** Инвалидировать карточки */
  cardInstances?: boolean;
  /** Инвалидировать магазин */
  shop?: boolean;
  /** Инвалидировать полные данные игры */
  fullGameData?: boolean;
  /** Инвалидировать статические данные */
  staticData?: boolean;
}

/**
 * Селективная инвалидация кэша
 */
export async function invalidateSelective(
  walletAddress: string,
  options: InvalidationOptions
): Promise<void> {
  const promises: Promise<void>[] = [];

  console.log('🎯 [SelectiveInvalidation] Invalidating:', {
    walletAddress,
    ...options
  });

  // Инвалидируем только то, что изменилось
  if (options.balance) {
    // Только баланс, без полной перезагрузки gameData
    promises.push(
      queryClient.invalidateQueries({ 
        queryKey: ['gameData', walletAddress],
        refetchType: 'none' // Не делаем refetch сразу
      }).then(() => {
        // Обновляем только поле balance через setQueryData
        queryClient.setQueryData(['gameData', walletAddress], (old: any) => {
          if (!old) return old;
          // Триггерим refetch только баланса
          return { ...old, _balanceStale: true };
        });
      })
    );
  }

  if (options.itemInstances) {
    promises.push(
      queryClient.invalidateQueries({ 
        queryKey: ['itemInstances', walletAddress],
        exact: true // Только точный ключ
      })
    );
  }

  if (options.cardInstances) {
    promises.push(
      queryClient.invalidateQueries({ 
        queryKey: ['cardInstances', walletAddress],
        exact: true
      })
    );
  }

  if (options.shop) {
    promises.push(
      queryClient.invalidateQueries({ 
        queryKey: ['shopDataComplete', walletAddress],
        exact: true
      }),
      queryClient.invalidateQueries({ 
        queryKey: ['shopInventory'],
        exact: true
      })
    );
  }

  if (options.fullGameData) {
    // Полная инвалидация gameData (редко используется)
    promises.push(
      queryClient.invalidateQueries({ 
        queryKey: ['gameData', walletAddress]
      })
    );
  }

  if (options.staticData) {
    promises.push(
      queryClient.invalidateQueries({ 
        queryKey: ['staticGameData', 'v2']
      })
    );
  }

  await Promise.all(promises);
  
  console.log('✅ [SelectiveInvalidation] Complete');
}

/**
 * Пресеты для частых операций
 */
export const invalidationPresets = {
  /** После покупки в магазине */
  afterShopPurchase: (walletAddress: string) =>
    invalidateSelective(walletAddress, {
      balance: true,
      itemInstances: true,
      shop: true,
    }),

  /** После крафта предмета */
  afterCrafting: (walletAddress: string) =>
    invalidateSelective(walletAddress, {
      itemInstances: true,
    }),

  /** После битвы */
  afterBattle: (walletAddress: string) =>
    invalidateSelective(walletAddress, {
      balance: true,
      cardInstances: true,
    }),

  /** После апгрейда здания */
  afterBuildingUpgrade: (walletAddress: string) =>
    invalidateSelective(walletAddress, {
      balance: true,
      fullGameData: true,
    }),

  /** После лечения карточек */
  afterHealing: (walletAddress: string) =>
    invalidateSelective(walletAddress, {
      cardInstances: true,
    }),
};
