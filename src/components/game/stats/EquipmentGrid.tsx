import { useEffect, useState } from "react";
import { ShopItem } from "@/components/shop/types";
import { useToast } from "@/hooks/use-toast";
import { EquipmentSlot } from "./equipment/EquipmentSlot";
import { EquipmentStats } from "./equipment/EquipmentStats";
import { EquipmentSelectionDialog } from "./equipment/EquipmentDialog";
export const EquipmentGrid = () => {
  const [equippedItems, setEquippedItems] = useState<ShopItem[]>([]);
  const [totalStats, setTotalStats] = useState({
    power: 0,
    defense: 0,
    health: 0
  });
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [availableItems, setAvailableItems] = useState<ShopItem[]>([]);
  const {
    toast
  } = useToast();
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
      }, {
        power: 0,
        defense: 0,
        health: 0
      });
      setTotalStats(stats);
    }
  }, []);
  const handleEquipItem = (item: ShopItem) => {
    const inventory = localStorage.getItem('gameInventory');
    if (inventory) {
      const items = JSON.parse(inventory);
      const updatedItems = items.map((invItem: ShopItem) => {
        if (invItem.equipped && invItem.slot === selectedSlot) {
          return {
            ...invItem,
            equipped: false
          };
        }
        if (invItem.id === item.id) {
          return {
            ...invItem,
            equipped: true
          };
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
      }, {
        power: 0,
        defense: 0,
        health: 0
      });
      setTotalStats(stats);
      toast({
        title: "Предмет экипирован",
        description: `${item.name} был экипирован`
      });

      // Отправляем события об изменении экипировки
      const inventoryEvent = new CustomEvent('inventoryUpdate', {
        detail: {
          inventory: updatedItems
        }
      });
      window.dispatchEvent(inventoryEvent);
      const equipmentEvent = new CustomEvent('equipmentChange');
      window.dispatchEvent(equipmentEvent);
      setSelectedSlot(null);
    }
  };
  const handleUnequipItem = (item: ShopItem) => {
    const inventory = localStorage.getItem('gameInventory');
    if (inventory) {
      const items = JSON.parse(inventory);
      const updatedItems = items.map((invItem: ShopItem) => {
        if (invItem.id === item.id) {
          return {
            ...invItem,
            equipped: false
          };
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
      }, {
        power: 0,
        defense: 0,
        health: 0
      });
      setTotalStats(stats);
      toast({
        title: "Предмет снят",
        description: `${item.name} был снят`
      });

      // Отправляем события об изменении экипировки
      const inventoryEvent = new CustomEvent('inventoryUpdate', {
        detail: {
          inventory: updatedItems
        }
      });
      window.dispatchEvent(inventoryEvent);
      const equipmentEvent = new CustomEvent('equipmentChange');
      window.dispatchEvent(equipmentEvent);
    }
  };
  const handleSlotClick = (slot: string, equippedItem?: ShopItem) => {
    if (equippedItem) {
      handleUnequipItem(equippedItem);
    } else {
      const inventory = localStorage.getItem('gameInventory');
      if (inventory) {
        const items = JSON.parse(inventory);
        const availableForSlot = items.filter((item: ShopItem) => !item.equipped && item.slot === slot);
        setAvailableItems(availableForSlot);
        setSelectedSlot(slot);
      }
    }
  };
  const getEquippedItemForSlot = (slot: string) => {
    return equippedItems.find(item => item.slot === slot);
  };
  const slots = [{
    slot: "head",
    title: "Голова"
  }, {
    slot: "neck",
    title: "Шея"
  }, {
    slot: "shoulders",
    title: "Плечи"
  }, {
    slot: "chest",
    title: "Грудь"
  }, {
    slot: "hands",
    title: "Руки"
  }, {
    slot: "ring1",
    title: "Кольцо 1"
  }, {
    slot: "accessory1",
    title: "Брошь 1"
  }, {
    slot: "weapon",
    title: "Оружие"
  }, {
    slot: "belt",
    title: "Пояс"
  }, {
    slot: "legs",
    title: "Ноги"
  }, {
    slot: "feet",
    title: "Ботинки"
  }, {
    slot: "offhand",
    title: "Левая рука"
  }, {
    slot: "ring2",
    title: "Кольцо 2"
  }, {
    slot: "accessory2",
    title: "Брошь 2"
  }];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4 p-4 bg-game-surface/50 rounded-lg border border-game-accent">
        <div className="text-center">
          <div className="text-2xl font-bold text-red-400">{totalStats.power}</div>
          <div className="text-sm text-game-accent">Сила</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-400">{totalStats.defense}</div>
          <div className="text-sm text-game-accent">Защита</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-400">{totalStats.health}</div>
          <div className="text-sm text-game-accent">Здоровье</div>
        </div>
      </div>
      
      <div className="grid grid-cols-7 gap-2">
        {slots.map((slotInfo) => (
          <div
            key={slotInfo.slot}
            className="h-20 border-2 border-game-accent/30 rounded-lg flex items-center justify-center bg-game-surface/30 hover:bg-game-accent/20 cursor-pointer transition-colors"
            onClick={() => handleSlotClick(slotInfo.slot, getEquippedItemForSlot(slotInfo.slot))}
          >
            {getEquippedItemForSlot(slotInfo.slot) ? (
              <div className="text-xs text-center text-game-accent">
                {getEquippedItemForSlot(slotInfo.slot)?.name}
              </div>
            ) : (
              <div className="text-xs text-center text-game-accent/50">
                {slotInfo.title}
              </div>
            )}
          </div>
        ))}
      </div>

      {selectedSlot && (
        <div className="bg-game-surface/50 p-4 rounded-lg border border-game-accent">
          <h3 className="text-lg font-bold text-game-accent mb-3">Доступные предметы для слота {selectedSlot}</h3>
          <div className="grid grid-cols-3 gap-2">
            {availableItems.map((item) => (
              <div
                key={item.id}
                className="p-2 border border-game-accent/30 rounded-lg cursor-pointer hover:bg-game-accent/20 transition-colors"
                onClick={() => handleEquipItem(item)}
              >
                <div className="text-sm text-game-accent">{item.name}</div>
              </div>
            ))}
          </div>
          <button
            className="mt-3 px-4 py-2 bg-game-accent text-game-surface rounded-lg hover:bg-game-accent/80 transition-colors"
            onClick={() => setSelectedSlot(null)}
          >
            Закрыть
          </button>
        </div>
      )}
    </div>
  );
};