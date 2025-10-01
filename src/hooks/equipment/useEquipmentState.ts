import { useState, useEffect, useCallback } from 'react';
import { Item } from '@/types/inventory';
import { useInventoryState } from '@/hooks/useInventoryState';
import { useToast } from '@/hooks/use-toast';
import { canEquipItem, getEquipmentSlot } from '@/utils/itemUtils';

/**
 * Hook for managing equipment state and operations
 */
export const useEquipmentState = () => {
  const { inventory, updateInventory } = useInventoryState();
  const { toast } = useToast();

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
      const updatedInventory = inventory.map(invItem => 
        invItem.id === item.id 
          ? { ...invItem, equipped: false } 
          : invItem
      );
      
      updateInventory(updatedInventory);
      
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

    updateInventory(updatedInventory);
    
    toast({
      title: "Готово",
      description: `${item.name} экипирован`
    });
    
    return true;
  }, [inventory, updateInventory, toast]);

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

  /**
   * Sync equipment changes across tabs
   */
  useEffect(() => {
    const handleEquipmentChange = () => {
      try {
        const currentInventory = localStorage.getItem('gameInventory');
        const parsedInventory = currentInventory ? JSON.parse(currentInventory) : [];
        
        const event = new CustomEvent('inventoryUpdate', {
          detail: { inventory: parsedInventory }
        });
        
        window.dispatchEvent(event);
      } catch (error) {
        console.error('Error handling equipment change:', error);
      }
    };

    window.addEventListener('equipmentChange', handleEquipmentChange);
    return () => window.removeEventListener('equipmentChange', handleEquipmentChange);
  }, []);

  return {
    inventory,
    toggleEquipItem,
    getEquippedItems,
    getItemsBySlot
  };
};
