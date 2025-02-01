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
        className="p-1 bg-game-surface/50 border-game-accent min-h-[60px] w-[60px] flex flex-col items-center justify-center cursor-pointer hover:bg-game-surface/70"
        onClick={() => item && handleUnequipItem(item)}
      >
        {item ? (
          <>
            <img 
              src={item.image} 
              alt={item.name}
              className="w-8 h-8 object-contain"
            />
            <span className="text-[8px] text-center mt-0.5 text-game-accent leading-tight">{item.name}</span>
          </>
        ) : (
          <span className="text-[8px] text-center text-game-accent/50">{title}</span>
        )}
      </Card>
    );
  };

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-game-accent">Бонусы экипировки</h3>
      <div className="flex justify-between text-xs text-game-accent mb-2">
        <div className="grid grid-cols-3 gap-x-4">
          <p>Сила: +{totalStats.power}</p>
          <p>Защита: +{totalStats.defense}</p>
          <p>Здоровье: +{totalStats.health}</p>
        </div>
      </div>

      <div className="grid gap-1">
        {/* Верхний ряд */}
        <div className="flex justify-center gap-1">
          {renderEquipmentSlot("head", "Голова")}
        </div>

        {/* Второй ряд */}
        <div className="flex justify-center gap-1">
          {renderEquipmentSlot("neck", "Шея")}
          {renderEquipmentSlot("shoulders", "Наплечники")}
          {renderEquipmentSlot("accessory1", "Бижу 1")}
        </div>

        {/* Третий ряд */}
        <div className="flex justify-center gap-1">
          {renderEquipmentSlot("weapon", "Пр.рука")}
          {renderEquipmentSlot("chest", "Грудь")}
          {renderEquipmentSlot("offhand", "Л.рука")}
        </div>

        {/* Четвертый ряд */}
        <div className="flex justify-center gap-1">
          {renderEquipmentSlot("hands", "Перчатки")}
          {renderEquipmentSlot("belt", "Пояс")}
          {renderEquipmentSlot("accessory2", "Бижу 2")}
        </div>

        {/* Пятый ряд */}
        <div className="flex justify-center gap-1">
          {renderEquipmentSlot("ring1", "Кольцо")}
          {renderEquipmentSlot("legs", "Ноги")}
          {renderEquipmentSlot("ring2", "Кольцо")}
        </div>

        {/* Нижний ряд */}
        <div className="flex justify-center gap-1">
          {renderEquipmentSlot("feet", "Ботинки")}
        </div>
      </div>
    </div>
  );
};