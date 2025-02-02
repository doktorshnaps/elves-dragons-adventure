import { InventoryDisplay } from "../../InventoryDisplay";
import { Item } from "@/types/inventory";

interface AdventureInventoryProps {
  onUseItem: (item: Item) => void;
}

export const AdventureInventory = ({ onUseItem }: AdventureInventoryProps) => {
  return (
    <div className="space-y-4">
      <h3 className="text-2xl font-bold text-game-accent">Инвентарь</h3>
      <InventoryDisplay onUseItem={onUseItem} />
    </div>
  );
};