import { Item } from "@/components/battle/Inventory";
import { useDragonEggs } from "@/contexts/DragonEggContext";
import { useInventoryLogic } from "./inventory/useInventoryLogic";
import { InventoryHeader } from "./inventory/InventoryHeader";
import { DragonEggsList } from "./inventory/DragonEggsList";
import { InventoryGrid } from "./inventory/InventoryGrid";
import { GroupedItem } from "./inventory/types";

interface InventoryDisplayProps {
  inventory: Item[];
  onUseItem?: (item: Item) => void;
  readonly?: boolean;
}

export const InventoryDisplay = ({ 
  inventory: initialInventory, 
  onUseItem, 
  readonly = false 
}: InventoryDisplayProps) => {
  const { eggs } = useDragonEggs();
  const {
    balance,
    groupItems,
    handleSellItem,
  } = useInventoryLogic(initialInventory);

  const handleUseGroupedItem = (groupedItem: GroupedItem) => {
    if (!readonly && onUseItem && groupedItem.items.length > 0) {
      onUseItem(groupedItem.items[0]);
    }
  };

  return (
    <div 
      className="mt-4 relative rounded-lg overflow-hidden"
      style={{
        backgroundImage: 'url("/lovable-uploads/2eecde4e-bda9-4f8f-8105-3e6dcdff36fc.png")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="p-4">
        <InventoryHeader balance={balance} />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          <DragonEggsList eggs={eggs} />
          <InventoryGrid
            groupedItems={groupItems(initialInventory)}
            readonly={readonly}
            onUseItem={handleUseGroupedItem}
            onSellItem={handleSellItem}
          />
        </div>
      </div>
    </div>
  );
};