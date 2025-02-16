import { useEffect, useState } from "react";
import { ShopItem } from "@/components/shop/types";
import { useToast } from "@/hooks/use-toast";
import { EquipmentSlot } from "./equipment/EquipmentSlot";
import { EquipmentStats } from "./equipment/EquipmentStats";
import { EquipmentSelectionDialog } from "./equipment/EquipmentDialog";

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

  const slots = [
    { slot: "head", title: "Голова" },
    { slot: "neck", title: "Шея" },
    { slot: "shoulders", title: "Плечи" },
    { slot: "chest", title: "Грудь" },
    { slot: "hands", title: "Руки" },
    { slot: "ring1", title: "Кольцо 1" },
    { slot: "accessory1", title: "Брошь 1" },
    { slot: "weapon", title: "Оружие" },
    { slot: "belt", title: "Пояс" },
    { slot: "legs", title: "Ноги" },
    { slot: "feet", title: "Ботинки" },
    { slot: "offhand", title: "Левая рука" },
    { slot: "ring2", title: "Кольцо 2" },
    { slot: "accessory2", title: "Брошь 2" },
  ];

  return (
    <div className="space-y-4">
      <EquipmentStats totalStats={totalStats} />

      <div className="grid grid-cols-7 gap-1 px-2">
        {slots.map(({ slot, title }) => (
          <EquipmentSlot
            key={slot}
            slot={slot}
            title={title}
            item={getEquippedItemForSlot(slot)}
            onSlotClick={handleSlotClick}
          />
        ))}
      </div>

      <EquipmentSelectionDialog
        selectedSlot={selectedSlot}
        availableItems={availableItems}
        onClose={() => setSelectedSlot(null)}
        onEquipItem={handleEquipItem}
      />
    </div>
  );
};