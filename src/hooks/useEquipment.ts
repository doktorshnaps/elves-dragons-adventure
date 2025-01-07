import { useState, useEffect } from 'react';
import { Equipment, EquippedItems, EquipmentType } from '@/types/equipment';
import { useToast } from '@/hooks/use-toast';

export const useEquipment = () => {
  const { toast } = useToast();
  const [equippedItems, setEquippedItems] = useState<EquippedItems>(() => {
    const savedEquipment = localStorage.getItem('equippedItems');
    return savedEquipment ? JSON.parse(savedEquipment) : {
      weapon: null,
      shield: null,
      armor: null,
      ring1: null,
      ring2: null,
      necklace: null
    };
  });

  useEffect(() => {
    localStorage.setItem('equippedItems', JSON.stringify(equippedItems));
  }, [equippedItems]);

  const handleEquip = (item: Equipment) => {
    setEquippedItems(prev => {
      const newEquipped = { ...prev };
      
      if (item.type === 'ring') {
        if (!prev.ring1) {
          newEquipped.ring1 = { ...item, equipped: true, slot: 'ring1' };
        } else if (!prev.ring2) {
          newEquipped.ring2 = { ...item, equipped: true, slot: 'ring2' };
        } else {
          newEquipped.ring1 = { ...item, equipped: true, slot: 'ring1' };
        }
      } else {
        const slot = item.type;
        newEquipped[slot] = { ...item, equipped: true };
      }

      toast({
        title: "Предмет экипирован",
        description: `${item.name} успешно экипирован`,
      });

      return newEquipped;
    });
  };

  const handleUnequip = (slot: keyof EquippedItems) => {
    setEquippedItems(prev => {
      const newEquipped = { ...prev };
      const item = newEquipped[slot];
      
      if (item) {
        toast({
          title: "Предмет снят",
          description: `${item.name} успешно снят`,
        });
      }
      
      newEquipped[slot] = null;
      return newEquipped;
    });
  };

  return {
    equippedItems,
    handleEquip,
    handleUnequip
  };
};