import { useState, useCallback } from 'react';
import { useToast } from './use-toast';
import { 
  batchOperationsService,
  CraftingRecipe,
  CardUpdate,
  ItemSaleData,
  PurchaseData,
  CardUpgradeData,
  BatchCraftResult,
  BatchCardUpdateResult,
  BatchSellResult,
  BatchPurchaseResult,
  BatchUpgradeResult
} from '@/services/BatchOperationsService';
import { invalidateSelective } from '@/utils/selectiveInvalidation';

/**
 * useBatchOperations - React Hook для централизованного доступа к batch операциям
 * 
 * Предоставляет единый интерфейс для всех массовых операций с автоматической
 * инвалидацией кеша и уведомлениями пользователя.
 * 
 * Использование:
 * const { craftMultiple, updateCards, sellItems, buyItems, upgradeCards, isProcessing } = useBatchOperations(walletAddress);
 */
export const useBatchOperations = (walletAddress: string | null) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  /**
   * Selective invalidation вместо полной инвалидации
   */
  const invalidateCaches = useCallback(async () => {
    if (!walletAddress) return;

    // Селективная инвалидация только измененных данных
    await invalidateSelective(walletAddress, {
      itemInstances: true,
      balance: true,
    });
  }, [walletAddress]);

  /**
   * Craft multiple items
   */
  const craftMultiple = useCallback(async (
    recipes: CraftingRecipe[]
  ): Promise<BatchCraftResult | null> => {
    if (!walletAddress) {
      toast({
        title: 'Ошибка',
        description: 'Кошелек не подключен',
        variant: 'destructive'
      });
      return null;
    }

    setIsProcessing(true);
    try {
      const result = await batchOperationsService.craftMultiple(walletAddress, recipes);
      
      if (result) {
        await invalidateCaches();
        toast({
          title: 'Крафт завершен!',
          description: `Создано предметов: ${result.total_crafted}`
        });
      } else {
        toast({
          title: 'Ошибка крафта',
          description: 'Не удалось создать предметы',
          variant: 'destructive'
        });
      }

      return result;
    } finally {
      setIsProcessing(false);
    }
  }, [walletAddress, toast, invalidateCaches]);

  /**
   * Update multiple cards
   */
  const updateCards = useCallback(async (
    updates: CardUpdate[]
  ): Promise<BatchCardUpdateResult | null> => {
    if (!walletAddress) {
      toast({
        title: 'Ошибка',
        description: 'Кошелек не подключен',
        variant: 'destructive'
      });
      return null;
    }

    setIsProcessing(true);
    try {
      const result = await batchOperationsService.updateMultipleCards(walletAddress, updates);
      
      if (result) {
        await invalidateCaches();
        toast({
          title: 'Обновление завершено!',
          description: `Обновлено карт: ${result.cards_updated}`
        });
      } else {
        toast({
          title: 'Ошибка обновления',
          description: 'Не удалось обновить карты',
          variant: 'destructive'
        });
      }

      return result;
    } finally {
      setIsProcessing(false);
    }
  }, [walletAddress, toast, invalidateCaches]);

  /**
   * Sell multiple items
   */
  const sellItems = useCallback(async (
    items: ItemSaleData[]
  ): Promise<BatchSellResult | null> => {
    if (!walletAddress) {
      toast({
        title: 'Ошибка',
        description: 'Кошелек не подключен',
        variant: 'destructive'
      });
      return null;
    }

    setIsProcessing(true);
    try {
      const result = await batchOperationsService.sellMultipleItems(walletAddress, items);
      
      if (result) {
        await invalidateCaches();
        toast({
          title: 'Продажа завершена!',
          description: `Продано предметов: ${result.items_sold}, Заработано: ${result.total_earnings} ELL`
        });
      } else {
        toast({
          title: 'Ошибка продажи',
          description: 'Не удалось продать предметы',
          variant: 'destructive'
        });
      }

      return result;
    } finally {
      setIsProcessing(false);
    }
  }, [walletAddress, toast, invalidateCaches]);

  /**
   * Buy multiple items
   */
  const buyItems = useCallback(async (
    purchases: PurchaseData[]
  ): Promise<BatchPurchaseResult | null> => {
    if (!walletAddress) {
      toast({
        title: 'Ошибка',
        description: 'Кошелек не подключен',
        variant: 'destructive'
      });
      return null;
    }

    setIsProcessing(true);
    try {
      const result = await batchOperationsService.buyMultipleItems(walletAddress, purchases);
      
      if (result) {
        await invalidateCaches();
        toast({
          title: 'Покупка завершена!',
          description: `Куплено предметов: ${result.items_purchased}, Потрачено: ${result.total_cost} ELL`
        });
      } else {
        toast({
          title: 'Ошибка покупки',
          description: 'Не удалось купить предметы',
          variant: 'destructive'
        });
      }

      return result;
    } finally {
      setIsProcessing(false);
    }
  }, [walletAddress, toast, invalidateCaches]);

  /**
   * Upgrade multiple cards
   */
  const upgradeCards = useCallback(async (
    upgrades: CardUpgradeData[]
  ): Promise<BatchUpgradeResult | null> => {
    if (!walletAddress) {
      toast({
        title: 'Ошибка',
        description: 'Кошелек не подключен',
        variant: 'destructive'
      });
      return null;
    }

    setIsProcessing(true);
    try {
      const result = await batchOperationsService.upgradeMultipleCards(walletAddress, upgrades);
      
      if (result) {
        await invalidateCaches();
        
        if (result.failed_upgrades.length > 0) {
          toast({
            title: 'Улучшение завершено с ошибками',
            description: `Улучшено: ${result.cards_upgraded}, Не удалось: ${result.failed_upgrades.length}`,
            variant: 'destructive'
          });
        } else {
          toast({
            title: 'Улучшение завершено!',
            description: `Улучшено карт: ${result.cards_upgraded}`
          });
        }
      } else {
        toast({
          title: 'Ошибка улучшения',
          description: 'Не удалось улучшить карты',
          variant: 'destructive'
        });
      }

      return result;
    } finally {
      setIsProcessing(false);
    }
  }, [walletAddress, toast, invalidateCaches]);

  return {
    craftMultiple,
    updateCards,
    sellItems,
    buyItems,
    upgradeCards,
    isProcessing
  };
};
