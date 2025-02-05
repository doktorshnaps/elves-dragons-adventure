
import { Item } from "@/types/inventory";
import { useDragonEggs } from "@/contexts/DragonEggContext";
import { useInventoryLogic } from "./inventory/useInventoryLogic";
import { InventoryHeader } from "./inventory/InventoryHeader";
import { DragonEggsList } from "./inventory/DragonEggsList";
import { InventoryGrid } from "./inventory/InventoryGrid";
import { useInventoryState } from "@/hooks/useInventoryState";
import { useToast } from "@/hooks/use-toast";
import { GroupedItem } from "./inventory/types";

interface InventoryDisplayProps {
  onUseItem?: (item: Item) => void;
  onSellItem?: (item: Item) => void;
  readonly?: boolean;
  showOnlyPotions?: boolean;
}

export const InventoryDisplay = ({ 
  onUseItem, 
  onSellItem,
  readonly = false,
  showOnlyPotions = false
}: InventoryDisplayProps) => {
  const { eggs } = useDragonEggs();
  const { inventory } = useInventoryState();
  const { toast } = useToast();
  const {
    balance,
    groupItems,
    handleSellItem,
  } = useInventoryLogic(inventory);

  const handleUseItem = (item: Item) => {
    if (!readonly && onUseItem) {
      if (item.type === 'cardPack') {
        toast({
          title: "Недоступно",
          description: "Колоды карт можно использовать только в магазине",
          variant: "destructive"
        });
        return;
      }
      onUseItem(item);
    }
  };

  const filteredInventory = showOnlyPotions 
    ? inventory.filter(item => item.type === 'healthPotion')
    : inventory;

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
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-y-1 gap-x-0.5">
          {!showOnlyPotions && <DragonEggsList eggs={eggs} />}
          <InventoryGrid
            groupedItems={groupItems(filteredInventory)}
            readonly={readonly}
            onUseItem={(groupedItem: GroupedItem) => handleUseItem(groupedItem.items[0])}
            onSellItem={(groupedItem: GroupedItem) => onSellItem?.(groupedItem.items[0])}
          />
        </div>
      </div>
    </div>
  );
};
