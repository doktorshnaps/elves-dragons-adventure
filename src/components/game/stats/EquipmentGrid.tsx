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
        className="p-2 bg-game-surface/50 border-game-accent min-h-[80px] w-[80px] flex flex-col items-center justify-center cursor-pointer hover:bg-game-surface/70"
        onClick={() => item && handleUnequipItem(item)}
      >
        {item ? (
          <>
            <img 
              src={item.image} 
              alt={item.name}
              className="w-10 h-10 object-contain"
            />
            <span className="text-xs text-center mt-1 text-game-accent leading-tight line-clamp-1">{item.name}</span>
          </>
        ) : (
          <span className="text-xs text-center text-game-accent/50">{title}</span>
        )}
      </Card>
    );
  };

  return (
    <div className="space-y-4 max-w-[650px] mx-auto">
      <h3 className="text-lg font-semibold text-game-accent">Бонусы экипировки</h3>
      <div className="flex justify-between text-base text-game-accent mb-4">
        <div className="grid grid-cols-3 gap-x-4">
          <p>Сила: +{totalStats.power}</p>
          <p>Защита: +{totalStats.defense}</p>
          <p>Жизнь: +{totalStats.health}</p>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 px-2">
        {/* Первая строка */}
        {renderEquipmentSlot("head", "Голова")}
        {renderEquipmentSlot("neck", "Шея")}
        {renderEquipmentSlot("shoulders", "Плечи")}
        {renderEquipmentSlot("chest", "Грудь")}
        {renderEquipmentSlot("hands", "Руки")}
        {renderEquipmentSlot("ring1", "Кольцо 1")}
        {renderEquipmentSlot("accessory1", "Брошь 1")}

        {/* Вторая строка */}
        {renderEquipmentSlot("weapon", "Оружие")}
        {renderEquipmentSlot("belt", "Пояс")}
        {renderEquipmentSlot("legs", "Ноги")}
        {renderEquipmentSlot("feet", "Ботинки")}
        {renderEquipmentSlot("offhand", "Левая рука")}
        {renderEquipmentSlot("ring2", "Кольцо 2")}
        {renderEquipmentSlot("accessory2", "Брошь 2")}
      </div>
    </div>
  );
};