import { useState } from 'react';
import { Equipment, EquippedItems } from '@/types/equipment';
import { useToast } from '@/hooks/use-toast';

export const useEquipment = () => {
  const { toast } = useToast();
  const [equippedItems, setEquippedItems] = useState<EquippedItems>({
    weapon: null,
    shield: null,
    armor: null,
    ring1: null,
    ring2: null,
    necklace: null
  });

  const handleEquip = (item: Equipment) => {
    setEquippedItems(prev => {
      const newEquipped = { ...prev };
      
      // Для колец используем специальную логику
      if (item.slot === 'ring1' || item.slot === 'ring2') {
        if (!prev.ring1) {
          newEquipped.ring1 = item;
        } else if (!prev.ring2) {
          newEquipped.ring2 = item;
        } else {
          // Если оба слота заняты, заменяем первое кольцо
          newEquipped.ring1 = item;
        }
      } else {
        // Для остальных предметов просто заменяем в соответствующем слоте
        newEquipped[item.slot] = item;
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