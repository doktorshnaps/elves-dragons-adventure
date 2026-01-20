import { useState, useEffect, useCallback } from 'react';
import { Item } from '@/types/inventory';
import { useItemInstances } from '@/hooks/useItemInstances';
import { useToast } from '@/hooks/use-toast';
import { canEquipItem, getEquipmentSlot } from '@/utils/itemUtils';
import { useGameEvent } from '@/contexts/GameEventsContext';

/**
 * Hook for managing equipment state and operations (работает с item_instances)
 */
export const useEquipmentState = () => {
  const { instances } = useItemInstances();
  const { toast } = useToast();
  
  // Преобразуем instances в Item[] формат
  const inventory: Item[] = instances.map(inst => ({
    id: inst.id,
    name: inst.name || 'Предмет',
    type: (inst.type as any) || 'material',
    value: 1,
    equipped: false, // TODO: добавить поле в item_instances
    slot: undefined // TODO: добавить поле в item_instances
  }));

  /**
   * Equip or unequip an item
   */
  const toggleEquipItem = useCallback((item: Item) => {
    if (!canEquipItem(item)) {
      toast({
        title: "Ошибка",
        description: "Этот предмет нельзя экипировать",
        variant: "destructive"
      });
      return false;
    }

    const slot = getEquipmentSlot(item);
    if (!slot) {
      toast({
        title: "Ошибка",
        description: "Неверный слот для предмета",
        variant: "destructive"
      });
      return false;
    }

    // If already equipped, unequip
    if (item.equipped) {
      // TODO: Обновить equipped статус в item_instances через RPC
      console.log('Item unequipped:', item.name);
      
      toast({
        title: "Готово",
        description: `${item.name} снят`
      });
      return true;
    }

    // Unequip item in the same slot if exists
    const equippedInSlot = inventory.find(
      invItem => invItem.equipped && invItem.slot === slot && invItem.id !== item.id
    );

    const updatedInventory = inventory.map(invItem => {
      if (invItem.id === item.id) {
        return { ...invItem, equipped: true, slot };
      }
      if (equippedInSlot && invItem.id === equippedInSlot.id) {
        return { ...invItem, equipped: false };
      }
      return invItem;
    });

    // TODO: Обновить equipped статус в item_instances через RPC
    console.log('Item equipped:', item.name);
    
    toast({
      title: "Готово",
      description: `${item.name} экипирован`
    });
    
    return true;
  }, [inventory, toast]);

  /**
   * Get equipped items
   */
  const getEquippedItems = useCallback(() => {
    return inventory.filter(item => item.equipped);
  }, [inventory]);

  /**
   * Get items by slot
   */
  const getItemsBySlot = useCallback((slot: string) => {
    return inventory.filter(item => item.slot === slot);
  }, [inventory]);

  // Sync equipment changes via GameEventsContext (no-op since item_instances handles it)
  useGameEvent('equipmentChange', () => {
    // Синхронизация происходит через item_instances real-time subscription
    // Не используем localStorage для инвентаря
  }, []);

  return {
    inventory,
    toggleEquipItem,
    getEquippedItems,
    getItemsBySlot
  };
};
