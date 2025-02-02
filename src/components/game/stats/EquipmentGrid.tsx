import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { ShopItem } from "@/components/shop/types";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export const EquipmentGrid = () => {
  const [equippedItems, setEquippedItems] = useState<ShopItem[]>([]);
  const [totalStats, setTotalStats] = useState({ power: 0, defense: 0, health: 0 });
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [availableItems, setAvailableItems] = useState<ShopItem[]>([]);
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

  const handleEquipItem = (item: ShopItem) => {
    const inventory = localStorage.getItem('gameInventory');
    if (inventory) {
      const items = JSON.parse(inventory);
      // Снимаем текущий предмет из этого слота, если он есть
      const updatedItems = items.map((invItem: ShopItem) => {
        if (invItem.equipped && invItem.slot === selectedSlot) {
          return { ...invItem, equipped: false };
        }
        if (invItem.id === item.id) {
          return { ...invItem, equipped: true };
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
        title: "Предмет экипирован",
        description: `${item.name} был экипирован`,
      });

      const event = new CustomEvent('inventoryUpdate', { 
        detail: { inventory: updatedItems }
      });
      window.dispatchEvent(event);
      setSelectedSlot(null);
    }
  };

  const handleSlotClick = (slot: string, equippedItem?: ShopItem) => {
    if (equippedItem) {
      handleUnequipItem(equippedItem);
    } else {
      const inventory = localStorage.getItem('gameInventory');
      if (inventory) {
        const items = JSON.parse(inventory);
        const availableForSlot = items.filter((item: ShopItem) => 
          !item.equipped && item.slot === slot
        );
        setAvailableItems(availableForSlot);
        setSelectedSlot(slot);
      }
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
        className="p-2 bg-game-surface/50 border-game-accent min-h-[50px] w-[50px] flex flex-col items-center justify-center cursor-pointer hover:bg-game-surface/70"
        onClick={() => handleSlotClick(slot, item)}
      >
        {item ? (
          <>
            <img 
              src={item.image} 
              alt={item.name}
              className="w-6 h-6 object-contain"
            />
            <span className="text-[10px] text-center mt-1 text-game-accent leading-tight line-clamp-1">{item.name}</span>
          </>
        ) : (
          <span className="text-[10px] text-center text-game-accent/50">{title}</span>
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

      <Dialog open={selectedSlot !== null} onOpenChange={() => setSelectedSlot(null)}>
        <DialogContent className="bg-game-surface border-game-accent">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-game-accent">
              Доступные предметы
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-[400px] overflow-y-auto">
            {availableItems.map((item) => (
              <Card 
                key={item.id}
                className="p-4 bg-game-surface/50 border-game-accent cursor-pointer hover:bg-game-surface/70"
                onClick={() => handleEquipItem(item)}
              >
                <div className="flex flex-col items-center gap-2">
                  {item.image && (
                    <img 
                      src={item.image} 
                      alt={item.name}
                      className="w-12 h-12 object-contain"
                    />
                  )}
                  <span className="text-sm text-center text-game-accent">{item.name}</span>
                  {item.stats && (
                    <div className="text-xs text-game-accent/80">
                      {item.stats.power && <div>Сила: +{item.stats.power}</div>}
                      {item.stats.defense && <div>Защита: +{item.stats.defense}</div>}
                      {item.stats.health && <div>Здоровье: +{item.stats.health}</div>}
                    </div>
                  )}
                </div>
              </Card>
            ))}
            {availableItems.length === 0 && (
              <div className="col-span-full text-center text-game-accent">
                Нет доступных предметов для этого слота
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};