import { useCallback } from 'react';
import { useItemInstances } from './useItemInstances';
import { useToast } from './use-toast';
import { Item } from '@/types/inventory';
import { getItemPrice } from '@/utils/itemUtils';
import { useGameData } from './useGameData';
import { useTreasureHuntItems } from './useTreasureHuntItems';

/**
 * Централизованный хук для всех операций с предметами
 * Работает ТОЛЬКО с item_instances (единственный источник истины)
 */
export const useItemOperations = () => {
  const { instances, removeItemInstancesByIds, addItemInstances } = useItemInstances();
  const { gameData, updateGameData } = useGameData();
  const { toast } = useToast();
  const { isQuestItem } = useTreasureHuntItems();

  /**
   * Добавить предметы в inventory
   */
  const addItems = useCallback(async (items: Array<{ name: string; type: string }>) => {
    if (items.length === 0) return;
    
    console.log('➕ Adding items to item_instances:', items);
    await addItemInstances(items);
    console.log('✅ Items added successfully');
  }, [addItemInstances]);

  /**
   * Удалить предмет по ID instance
   */
  const removeItem = useCallback(async (instanceId: string) => {
    console.log('➖ Removing item instance:', instanceId);
    await removeItemInstancesByIds([instanceId]);
    console.log('✅ Item removed successfully');
  }, [removeItemInstancesByIds]);

  /**
   * Удалить несколько предметов по имени (например, для использования зелий)
   */
  const removeItemsByName = useCallback(async (name: string, count: number = 1) => {
    const itemsToRemove = instances
      .filter(inst => inst.name === name)
      .slice(0, count);
    
    if (itemsToRemove.length < count) {
      toast({
        title: 'Недостаточно предметов',
        description: `Требуется ${count}, но найдено только ${itemsToRemove.length}`,
        variant: 'destructive'
      });
      return false;
    }

    const ids = itemsToRemove.map(inst => inst.id);
    console.log(`➖ Removing ${count} items named "${name}":`, ids);
    await removeItemInstancesByIds(ids);
    console.log('✅ Items removed successfully');
    return true;
  }, [instances, removeItemInstancesByIds, toast]);

  /**
   * Продать предмет (удаляет из instances, добавляет баланс)
   */
  const sellItem = useCallback(async (item: { id: string; name: string; type: string; value?: number; sell_price?: number; template_id?: number }) => {
    // Проверяем, что предмет не квестовый
    if (isQuestItem(item.template_id)) {
      toast({
        title: 'Нельзя продать',
        description: 'Квестовые предметы не могут быть проданы',
        variant: 'destructive'
      });
      return false;
    }

    // Проверяем, что предмет существует
    const exists = instances.some(inst => inst.id === item.id);
    if (!exists) {
      toast({
        title: 'Нельзя продать',
        description: 'Этот предмет уже отсутствует в вашем инвентаре',
        variant: 'destructive'
      });
      return false;
    }

    // ИСПРАВЛЕНО: используем sell_price из БД напрямую, а не getItemPrice
    // getItemPrice возвращает ЦЕНУ ПОКУПКИ (завышенную), а не цену продажи
    const sellPrice = item.sell_price !== undefined 
      ? item.sell_price 
      : Math.floor((item.value || 0) * 0.7); // Fallback: 70% от значения предмета

    const newBalance = gameData.balance + sellPrice;

    // Удаляем из instances
    await removeItemInstancesByIds([item.id]);
    
    // Обновляем баланс
    await updateGameData({ balance: newBalance });

    toast({
      title: 'Предмет продан',
      description: `${item.name} продан за ${sellPrice} ELL`,
    });

    return true;
  }, [instances, removeItemInstancesByIds, gameData.balance, updateGameData, toast, isQuestItem]);

  /**
   * Продать несколько предметов по имени
   */
  const sellMultipleItems = useCallback(async (name: string, quantity: number, sellPricePerItem: number) => {
    // Находим нужное количество предметов
    const itemsToSell = instances
      .filter(inst => inst.name === name)
      .slice(0, quantity);
    
    if (itemsToSell.length < quantity) {
      toast({
        title: 'Недостаточно предметов',
        description: `Требуется ${quantity}, но найдено только ${itemsToSell.length}`,
        variant: 'destructive'
      });
      return false;
    }

    // Проверяем, что ни один из предметов не квестовый
    const hasQuestItem = itemsToSell.some(inst => isQuestItem(inst.template_id));
    if (hasQuestItem) {
      toast({
        title: 'Нельзя продать',
        description: 'Квестовые предметы не могут быть проданы',
        variant: 'destructive'
      });
      return false;
    }

    const totalPrice = sellPricePerItem * quantity;
    const newBalance = gameData.balance + totalPrice;
    
    // Удаляем все предметы
    const ids = itemsToSell.map(inst => inst.id);
    await removeItemInstancesByIds(ids);
    
    // Обновляем баланс
    await updateGameData({ balance: newBalance });

    toast({
      title: 'Предметы проданы',
      description: `${name} (x${quantity}) продано за ${totalPrice} ELL`,
    });

    return true;
  }, [instances, removeItemInstancesByIds, gameData.balance, updateGameData, toast, isQuestItem]);

  /**
   * Использовать предмет (например, зелье)
   */
  const useItem = useCallback(async (item: { id: string; name: string; type: string; value: number }) => {
    const exists = instances.some(inst => inst.id === item.id);
    if (!exists) {
      toast({
        title: 'Предмет не найден',
        description: 'Этот предмет уже отсутствует в вашем инвентаре',
        variant: 'destructive'
      });
      return false;
    }

    // Удаляем из instances
    await removeItemInstancesByIds([item.id]);
    
    console.log('✅ Item used:', item.name);
    return true;
  }, [instances, removeItemInstancesByIds, toast]);

  return {
    instances,
    addItems,
    removeItem,
    removeItemsByName,
    sellItem,
    sellMultipleItems,
    useItem
  };
};
