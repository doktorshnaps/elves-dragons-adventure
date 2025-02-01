import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { ShopItem } from "@/components/shop/types";

export const EquipmentGrid = () => {
  const [equippedItems, setEquippedItems] = useState<ShopItem[]>([]);
  const [totalStats, setTotalStats] = useState({ power: 0, defense: 0, health: 0 });

  useEffect(() => {
    const inventory = localStorage.getItem('gameInventory');
    if (inventory) {
      const items = JSON.parse(inventory);
      const equipped = items.filter((item: ShopItem) => item.equipped);
      setEquippedItems(equipped);

      // Calculate total stats from equipped items
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

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-game-accent">Бонусы экипировки</h3>
      <div className="grid grid-cols-2 gap-4 text-sm text-game-accent">
        {totalStats.power > 0 && (
          <div>Сила: +{totalStats.power}</div>
        )}
        {totalStats.defense > 0 && (
          <div>Защита: +{totalStats.defense}</div>
        )}
        {totalStats.health > 0 && (
          <div>Здоровье: +{totalStats.health}</div>
        )}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {equippedItems.map((item) => (
          <Card key={item.id} className="p-2 bg-game-surface/50 border-game-accent">
            <img 
              src={item.image} 
              alt={item.name} 
              className="w-full h-12 object-contain mb-1"
            />
            <div className="text-[10px] text-game-accent text-center truncate">
              {item.name}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};