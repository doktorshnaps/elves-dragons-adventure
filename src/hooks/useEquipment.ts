import { useState, useEffect } from 'react';
import { Equipment, EquippedItems } from '@/types/equipment';
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
      
      // Для колец используем специальную логику
      if (item.type === 'ring') {
        if (!prev.ring1) {
          newEquipped.ring1 = { ...item, equipped: true, slot: 'ring1' };
        } else if (!prev.ring2) {
          newEquipped.ring2 = { ...item, equipped: true, slot: 'ring2' };
        } else {
          // Если оба слота заняты, заменяем первое кольцо
          newEquipped.ring1 = { ...item, equipped: true, slot: 'ring1' };
        }
      } else {
        // Для остальных предметов просто заменяем в соответствующем слоте
        const slot = item.type === 'ring' ? 'ring1' : item.type;
        newEquipped[slot] = { ...item, equipped: true };
      }

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