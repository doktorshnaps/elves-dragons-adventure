import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { ShopItem } from "@/components/shop/types";
import { useToast } from "@/hooks/use-toast";

export const EquipmentGrid = () => {
  const [equippedItems, setEquippedItems] = useState<ShopItem[]>([]);
  const [totalStats, setTotalStats] = useState({ power: 0, defense: 0, health: 0 });
  const { toast } = useToast();

  useEffect(() => {
    const inventory = localStorage.getItem('gameInventory');
    if (inventory) {
      const items = JSON.parse(inventory);
      const equipped = items.filter((item: ShopItem) => item.equipped);
      setEquippedItems(equipped);

      const stats = equipped.reduce((acc: any, item: ShopItem) => {
        if (item.stats) {
          acc.power += item.stats.power || 0;
          acc.defense += item.stats.defense || 0;
          acc.health += item.stats.health || 0;
        }
        return acc;
      }, { power: 0, defense: 0, health: 0 });

      setTotalStats(stats);
    }
  }, []);

  const handleUnequipItem = (item: ShopItem) => {
    const inventory = localStorage.getItem('gameInventory');
    if (inventory) {
      const items = JSON.parse(inventory);
      const updatedItems = items.map((invItem: ShopItem) => {
        if (invItem.id === item.id) {
          return { ...invItem, equipped: false };
        }
        return invItem;
      });

      localStorage.setItem('gameInventory', JSON.stringify(updatedItems));
      const equipped = updatedItems.filter((item: ShopItem) => item.equipped);
      setEquippedItems(equipped);

      const stats = equipped.reduce((acc: any, item: ShopItem) => {
        if (item.stats) {
          acc.power += item.stats.power || 0;
          acc.defense += item.stats.defense || 0;
          acc.health += item.stats.health || 0;
        }
        return acc;
      }, { power: 0, defense: 0, health: 0 });

      setTotalStats(stats);

      toast({
        title: "Предмет снят",
        description: `${item.name} был снят`,
      });

      const event = new CustomEvent('inventoryUpdate', { 
        detail: { inventory: updatedItems }
      });
      window.dispatchEvent(event);
    }
  };

  const getEquippedItemForSlot = (slot: string) => {
    return equippedItems.find(item => item.slot === slot);
  };

  const renderEquipmentSlot = (slot: string, title: string) => {
    const item = getEquippedItemForSlot(slot);
    return (
      <Card 
        key={slot} 
        className="p-1 bg-game-surface/50 border-game-accent min-h-[50px] w-[50px] flex flex-col items-center justify-center cursor-pointer hover:bg-game-surface/70"
        onClick={() => item && handleUnequipItem(item)}
      >
        {item ? (
          <>
            <img 
              src={item.image} 
              alt={item.name}
              className="w-6 h-6 object-contain"
            />
            <span className="text-[6px] text-center mt-0.5 text-game-accent leading-tight">{item.name}</span>
          </>
        ) : (
          <span className="text-[6px] text-center text-game-accent/50">{title}</span>
        )}
      </Card>
    );
  };

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold text-game-accent">Бонусы экипировки</h3>
      <div className="flex justify-between text-[10px] text-game-accent mb-2">
        <div className="grid grid-cols-3 gap-x-2">
          <p>С: +{totalStats.power}</p>
          <p>З: +{totalStats.defense}</p>
          <p>Ж: +{totalStats.health}</p>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {/* Первая строка */}
        {renderEquipmentSlot("head", "Гол")}
        {renderEquipmentSlot("neck", "Шея")}
        {renderEquipmentSlot("shoulders", "Плч")}
        {renderEquipmentSlot("chest", "Грд")}
        {renderEquipmentSlot("hands", "Рук")}
        {renderEquipmentSlot("ring1", "К1")}
        {renderEquipmentSlot("accessory1", "Б1")}

        {/* Вторая строка */}
        {renderEquipmentSlot("weapon", "Ор")}
        {renderEquipmentSlot("belt", "Поя")}
        {renderEquipmentSlot("legs", "Ног")}
        {renderEquipmentSlot("feet", "Бот")}
        {renderEquipmentSlot("offhand", "ЛР")}
        {renderEquipmentSlot("ring2", "К2")}
        {renderEquipmentSlot("accessory2", "Б2")}
      </div>
    </div>
  );
};