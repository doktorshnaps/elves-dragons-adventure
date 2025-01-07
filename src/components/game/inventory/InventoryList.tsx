import { Item } from "@/components/battle/Inventory";
import { Equipment } from "@/types/equipment";
import { InventoryItem } from "./InventoryItem";

interface InventoryListProps {
  items: (Item | Equipment)[];
  readonly?: boolean;
  onUseItem: (item: Item | Equipment) => void;
  onSellItem: (item: Item | Equipment) => void;
}

export const InventoryList = ({ items, readonly = false, onUseItem, onSellItem }: InventoryListProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {items.length > 0 ? (
        items.map((item) => (
          <InventoryItem
            key={'id' in item ? item.id : Math.random()}
            item={item}
            readonly={readonly}
            onUse={() => onUseItem(item)}
            onSell={() => onSellItem(item)}
          />
        ))
      ) : (
        <p className="text-gray-400 col-span-3 text-center py-8">Инвентарь пуст</p>
      )}
    </div>
  );
};